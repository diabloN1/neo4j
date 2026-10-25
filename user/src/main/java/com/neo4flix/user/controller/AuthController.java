package com.neo4flix.user.controller;

import jakarta.annotation.security.PermitAll;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;


import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import com.neo4flix.user.dto.AuthResponse;
import com.neo4flix.user.dto.AuthResult;
import com.neo4flix.user.dto.LoginRequest;
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
            @Valid @RequestBody RegisterRequest request,
            HttpServletResponse response) {

        AuthResult auth = authService.register(request);

        return new AuthResponse(
                auth.accessToken(),
                auth.user());
    }

    @PermitAll
    @PostMapping("/login")
    public AuthResponse login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response) {

        AuthResult auth = authService.login(request);

        return new AuthResponse(
                auth.accessToken(),
                auth.user());
    }
}