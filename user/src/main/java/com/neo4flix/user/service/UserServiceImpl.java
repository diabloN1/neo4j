package com.neo4flix.user.service;

import com.neo4flix.common.entity.User;
import com.neo4flix.user.client.RatingClient;
import com.neo4flix.user.dto.*;
import com.neo4flix.user.exception.BadRequestException;
import com.neo4flix.user.exception.ConflictException;
import com.neo4flix.user.exception.UnauthorizedException;
import com.neo4flix.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;

import java.time.Duration;
import java.time.Instant;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final TotpService totpService;
    private final TotpSecretEncryptionService totpSecretEncryptionService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RatingClient ratingClient;

    @Override
    @Transactional(readOnly = true)
    public UserResponse getProfile(Long userId, String authorization) {
        User user = getUserById(userId);

        UserResponse res = new UserResponse(user);
        res.setRatings(ratingClient.getMyRatings(authorization));

        return res;
    }

    @Override
    @Transactional
    public ProfileUpdateResponse updateProfile(Long userId, UpdateProfileRequest request) {
        User user = getUserById(userId);

        String newEmail = request.email().trim().toLowerCase();
        String newName = request.name().trim();

        if (!user.getEmail().equalsIgnoreCase(newEmail)) {
            userRepository.findByEmail(newEmail).ifPresent(existingUser -> {
                if (!existingUser.getId().equals(user.getId())) {
                    throw new ConflictException("Email is already in use by another account");
                }
            });
            user.setEmail(newEmail);
        }

        user.setName(newName);
        User updated = userRepository.save(user);

        String newToken = jwtService.generateAccessToken(updated);

        return new ProfileUpdateResponse(newToken, new UserResponse(updated));
    }

    @Override
    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = getUserById(userId);

        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new BadRequestException("Current password is incorrect");
        }

        if (passwordEncoder.matches(request.newPassword(), user.getPassword())) {
            throw new BadRequestException("New password cannot be the same as the current password");
        }

        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void deleteAccount(Long userId, DeleteAccountRequest request) {
        User user = getUserById(userId);

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new BadRequestException("Incorrect password. Account deletion canceled.");
        }

        userRepository.deleteUserAndOwnedDataById(userId);
    }

    private User getUserById(Long userId) {
        if (userId == null) {
            throw new UnauthorizedException("User session is not authenticated");
        }
        return userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("User account not found"));
    }

    @Override
    @Transactional
    public TotpSetupResponse setupTotp(Long userId) {
        User user = getUserById(userId);

        if (user.isMfaEnabled()) {
            throw new ConflictException("MFA is already enabled");
        }

        String secret = totpService.generateSecret();

        user.setPendingTotpSecretEncrypted(
                totpSecretEncryptionService.encrypt(secret));

        user.setPendingTotpSecretExpiresAt(
                Instant.now().plus(Duration.ofMinutes(10)));

        userRepository.save(user);

        String provisioningUri = totpService.generateProvisioningUri(
                user.getEmail(),
                secret);

        return new TotpSetupResponse(provisioningUri);
    }

    @Override
    @Transactional
    public void confirmTotp(Long userId, TotpConfirmRequest request) {
        User user = getUserById(userId);

        if (user.isMfaEnabled()) {
            throw new ConflictException("MFA is already enabled");
        }

        if (user.getPendingTotpSecretEncrypted() == null) {
            throw new BadRequestException("Start TOTP setup first");
        }

        Instant expiration = user.getPendingTotpSecretExpiresAt();

        if (expiration == null || !Instant.now().isBefore(expiration)) {
            throw new BadRequestException(
                    "TOTP setup expired. Please start again.");
        }

        String secret = totpSecretEncryptionService.decrypt(
                user.getPendingTotpSecretEncrypted());

        var matchedStep = totpService.verifyCode(
                secret,
                request.code(),
                Instant.now().getEpochSecond(),
                user.getLastUsedTotpStep());

        if (matchedStep.isEmpty()) {
            throw new BadRequestException(
                    "Invalid or expired authenticator code");
        }

        // Activate the TOTP secret.
        user.setTotpSecretEcrypted(
                user.getPendingTotpSecretEncrypted());

        user.setPendingTotpSecretEncrypted(null);
        user.setPendingTotpSecretExpiresAt(null);

        user.setLastUsedTotpStep(matchedStep.getAsLong());
        user.setMfaEnabled(true);

        userRepository.save(user);
    }

    @Override
    @Transactional
    public void disableTotp(Long userId, TotpDisableRequest request) {
        User user = getUserById(userId);

        if (!user.isMfaEnabled() || user.getTotpSecretEcrypted() == null) {
            throw new BadRequestException("Two-factor authentication is not enabled");
        }

        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new BadRequestException("Current password is incorrect");
        }

        String secret = totpSecretEncryptionService.decrypt(
                user.getTotpSecretEcrypted());

        var matchedStep = totpService.verifyCode(
                secret,
                request.code(),
                Instant.now().getEpochSecond(),
                user.getLastUsedTotpStep());

        if (matchedStep.isEmpty()) {
            throw new BadRequestException("Invalid or expired authenticator code");
        }

        user.setMfaEnabled(false);
        user.setTotpSecretEcrypted(null);
        user.setPendingTotpSecretEncrypted(null);
        user.setPendingTotpSecretExpiresAt(null);
        user.setLastUsedTotpStep(null);

        user.setMfaChallengeHash(null);
        user.setMfaChallengeExpiresAt(null);

        userRepository.save(user);
    }

    @Override
    @Transactional(readOnly = true)
    public MfaStatusResponse getMfaStatus(Long userId) {
        User user = getUserById(userId);
        return new MfaStatusResponse(user.isMfaEnabled());
    }
}