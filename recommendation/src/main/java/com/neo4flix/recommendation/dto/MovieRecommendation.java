package com.neo4flix.recommendation.dto;

public record MovieRecommendation(
        String movieId,
        String title,
        Integer year,
        String poster,
        Double score
) {
}