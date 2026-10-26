package com.neo4flix.rating.dto;

import java.time.Instant;

public record RatingResponse(
        String movieId,
        double rating,
        Instant createdAt,
        Instant updatedAt
) {}