package com.neo4flix.rating.dto;

public record RatingResponse(
        String movieId,
        double rating,
        String createdAt,
        String updatedAt
) {
}