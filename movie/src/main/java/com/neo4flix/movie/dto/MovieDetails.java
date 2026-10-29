package com.neo4flix.movie.dto;

import java.util.List;

public record MovieDetails(
        String movieId,
        String title,
        Integer year,
        String released,
        String plot,
        Long budget,
        Long revenue,
        Integer runtime,
        List<String> countries,
        List<String> languages,
        String imdbId,
        Double imdbRating,
        Long imdbVotes,
        String tmdbId,
        String poster,
        String url,
        List<String> genreNames,
        List<String> actorNames,
        List<String> directorNames
) {}