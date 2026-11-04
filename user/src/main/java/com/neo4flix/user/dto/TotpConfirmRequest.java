package com.neo4flix.user.dto;

import jakarta.validation.constraints.Pattern;

public record TotpConfirmRequest(
        @Pattern(regexp = "\\d{6}", message = "Code must contain exactly 6 digits") String code) {
}