package com.neo4flix.user.service;

import java.time.Duration;
import java.time.Instant;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.neo4flix.common.entity.User;
import com.neo4flix.user.dto.AuthResult;
import com.neo4flix.user.dto.LoginRequest;
import com.neo4flix.user.dto.MfaVerifyRequest;
import com.neo4flix.user.dto.RegisterRequest;
import com.neo4flix.user.dto.UserResponse;
import com.neo4flix.user.exception.ConflictException;
import com.neo4flix.user.exception.UnauthorizedException;
import com.neo4flix.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final MfaChallengeService mfaChallengeService;
    private final TotpService totpService;
    private final TotpSecretEncryptionService totpSecretEncryptionService;

    @Override
    public AuthResult register(RegisterRequest request) {

        if (userRepository.findByEmail(request.email()).isPresent()) {
            throw new ConflictException("Email already exists");
        }

        User user = new User();
        user.setName(request.name());
        user.setEmail(request.email());
        user.setPassword(passwordEncoder.encode(request.password()));

        user = userRepository.save(user);

        String accessToken = jwtService.generateAccessToken(user);

        return new AuthResult(
                accessToken,
                new UserResponse(user),
                false,
                null);
    }

    @Override
    public AuthResult login(LoginRequest request) {

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new UnauthorizedException("Invalid credentials"));

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new UnauthorizedException("Invalid credentials");
        }

        if (!user.isMfaEnabled()) {
            String accessToken = jwtService.generateAccessToken(user);

            return new AuthResult(
                    accessToken,
                    new UserResponse(user),
                    false,
                    null);
        }

        String challengeToken = mfaChallengeService.generateToken();

        user.setMfaChallengeHash(
                mfaChallengeService.hashToken(challengeToken));

        user.setMfaChallengeExpiresAt(
                Instant.now().plus(Duration.ofMinutes(5)));

        userRepository.save(user);

        return new AuthResult(
                null,
                null,
                true,
                challengeToken);
    }

    @Override
    @Transactional
    public AuthResult verifyMfa(MfaVerifyRequest request) {

        String challengeHash = mfaChallengeService.hashToken(
                request.challengeToken());

        User user = userRepository.findByMfaChallengeHash(challengeHash)
                .orElseThrow(() -> new UnauthorizedException("Invalid or expired MFA challenge"));

        if (user.getMfaChallengeExpiresAt() == null
                || !Instant.now().isBefore(user.getMfaChallengeExpiresAt())) {
            throw new UnauthorizedException("Invalid or expired MFA challenge");
        }

        if (!user.isMfaEnabled() || user.getTotpSecretEcrypted() == null) {
            throw new UnauthorizedException("MFA is not configured");
        }

        String secret = totpSecretEncryptionService.decrypt(
                user.getTotpSecretEcrypted());

        var matchedStep = totpService.verifyCode(
                secret,
                request.code(),
                Instant.now().getEpochSecond(),
                user.getLastUsedTotpStep());

        if (matchedStep.isEmpty()) {
            throw new UnauthorizedException("Invalid authenticator code");
        }

        user.setLastUsedTotpStep(matchedStep.getAsLong());

        // consume the challenge
        user.setMfaChallengeHash(null);
        user.setMfaChallengeExpiresAt(null);

        user = userRepository.save(user);

        String accessToken = jwtService.generateAccessToken(user);

        return new AuthResult(
                accessToken,
                new UserResponse(user),
                false,
                null);
    }
}