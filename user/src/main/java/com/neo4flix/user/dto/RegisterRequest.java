package com.neo4flix.user.dto;

import jakarta.validation.constraints.*;

public record RegisterRequest(

        @NotBlank @Size(min = 3, max = 25) String name,

        @Email @NotBlank String email,

        @NotBlank @Size(min = 8, max = 30) @NotBlank @Size(min = 8, max = 64, message = "Password must be between 8 and 64 characters") @Pattern(regexp = "^(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?]).{8,}$", message = "Password must be at least 8 characters long and contain at least one uppercase letter, one number, and one special character") String password

) {
}