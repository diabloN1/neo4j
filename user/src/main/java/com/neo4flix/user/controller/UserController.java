package com.neo4flix.user.controller;

import com.neo4flix.user.dto.*;
import com.neo4flix.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getProfile(@AuthenticationPrincipal Jwt jwt,
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authorization) {
        Long userId = extractUserId(jwt);
        return ResponseEntity.ok(userService.getProfile(userId, authorization));
    }

    @PutMapping("/me")
    public ResponseEntity<ProfileUpdateResponse> updateProfile(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody UpdateProfileRequest request) {
        Long userId = extractUserId(jwt);
        return ResponseEntity.ok(userService.updateProfile(userId, request));
    }

    @PutMapping("/me/password")
    public ResponseEntity<Void> changePassword(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody ChangePasswordRequest request) {
        Long userId = extractUserId(jwt);
        userService.changePassword(userId, request);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteAccount(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody DeleteAccountRequest request) {
        Long userId = extractUserId(jwt);
        userService.deleteAccount(userId, request);
        return ResponseEntity.noContent().build();
    }

    private Long extractUserId(Jwt jwt) {
        if (jwt == null)
            return null;
        Object claim = jwt.getClaim("userId");
        if (claim instanceof Number num)
            return num.longValue();
        if (claim instanceof String str && !str.isBlank())
            return Long.parseLong(str.trim());
        return null;
    }

    @PostMapping("/me/mfa/totp/setup")
    public ResponseEntity<TotpSetupResponse> setupTotp(
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(
                userService.setupTotp(extractUserId(jwt)));
    }

    @PostMapping("/me/mfa/totp/confirm")
    public ResponseEntity<Void> confirmTotp(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody TotpConfirmRequest request) {
        userService.confirmTotp(extractUserId(jwt), request);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me/mfa/status")
    public ResponseEntity<MfaStatusResponse> getMfaStatus(
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(
                userService.getMfaStatus(extractUserId(jwt)));
    }
}