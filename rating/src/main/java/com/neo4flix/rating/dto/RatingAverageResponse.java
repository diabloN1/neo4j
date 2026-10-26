package com.neo4flix.rating.dto;

public record RatingAverageResponse(
                String movieId,
                double averageRating,
                long ratingCount) {
}