package com.neo4flix.rating.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

public record RatingRequest(

        @NotNull(message = "Rating is required.")
        @DecimalMin(value = "0.5", message = "Rating must be at least 0.5.")
        @DecimalMax(value = "5.0", message = "Rating cannot exceed 5.0.")
        Double rating

) {
}