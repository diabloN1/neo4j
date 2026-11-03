package com.neo4flix.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record MfaVerifyRequest(
        @NotBlank String challengeToken,

        @NotBlank @Pattern(regexp = "\\d{6}", message = "Code must contain exactly 6 digits") String code) {
}