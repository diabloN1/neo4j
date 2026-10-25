package com.neo4flix.user.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.neo4flix.user.dto.AuthResult;
import com.neo4flix.user.dto.LoginRequest;
import com.neo4flix.user.dto.RegisterRequest;
import com.neo4flix.user.dto.UserResponse;
import com.neo4flix.user.entity.User;
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
                new UserResponse(user));
    }

    public AuthResult login(LoginRequest request) {

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new UnauthorizedException("Invalid credentials"));

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new UnauthorizedException("Invalid credentials");
        }

        String accessToken = jwtService.generateAccessToken(user);

        return new AuthResult(
                accessToken,
                new UserResponse(user));
    }
}
