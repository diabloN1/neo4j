package com.neo4flix.user.dto;

public record AuthResult(
        String accessToken,
        UserResponse user,
        boolean mfaRequired,
        String challengeToken) {
}