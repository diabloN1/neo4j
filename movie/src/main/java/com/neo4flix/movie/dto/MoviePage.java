package com.neo4flix.movie.dto;

import java.util.List;

public record MoviePage(
        List<MovieSummary> content,
        long totalElements,
        int page,
        int size,
        int totalPages
) {}