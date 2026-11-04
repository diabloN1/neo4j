package com.neo4flix.user.controller;

import jakarta.annotation.security.PermitAll;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import com.neo4flix.user.dto.AuthResponse;
import com.neo4flix.user.dto.AuthResult;
import com.neo4flix.user.dto.LoginRequest;
import com.neo4flix.user.dto.MfaVerifyRequest;
import com.neo4flix.user.dto.RegisterRequest;
import com.neo4flix.user.service.AuthService;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PermitAll
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(
            @Valid @RequestBody RegisterRequest request) {

        AuthResult auth = authService.register(request);

        return new AuthResponse(
                auth.accessToken(),
                auth.user(),
                auth.mfaRequired(),
                auth.challengeToken());
    }

    @PermitAll
    @PostMapping("/login")
    public AuthResponse login(
            @Valid @RequestBody LoginRequest request) {

        AuthResult auth = authService.login(request);

        return new AuthResponse(
                auth.accessToken(),
                auth.user(),
                auth.mfaRequired(),
                auth.challengeToken());
    }

    @PermitAll
    @PostMapping("/mfa/verify")
    public AuthResponse verifyMfa(
            @Valid @RequestBody MfaVerifyRequest request) {

        AuthResult auth = authService.verifyMfa(request);

        return new AuthResponse(
                auth.accessToken(),
                auth.user(),
                auth.mfaRequired(),
                auth.challengeToken());
    }
}