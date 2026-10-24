package com.neo4flix.movie.dto;

public record MovieSummary(
        String movieId,
        String title,
        Integer year,
        String released,
        Double imdbRating,
        String poster
) {}