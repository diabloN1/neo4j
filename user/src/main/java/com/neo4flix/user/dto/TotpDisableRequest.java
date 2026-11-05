package com.neo4flix.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record TotpDisableRequest(

        @NotBlank(message = "Current password is required") String currentPassword,

        @NotBlank(message = "Authenticator code is required") @Pattern(regexp = "\\d{6}", message = "Code must contain exactly 6 digits") String code

) {
}