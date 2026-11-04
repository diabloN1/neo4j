package com.neo4flix.rating.dto;

import java.time.Instant;

public record MyRatingResponse(
        String movieId,
        String movieTitle,
        double rating,
        Instant createdAt,
        Instant updatedAt) {
}
