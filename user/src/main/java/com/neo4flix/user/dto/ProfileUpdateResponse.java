package com.neo4flix.user.dto;

public record ProfileUpdateResponse(
        String accessToken,
        UserResponse user) {
}