package com.neo4flix.movie.service;

import com.neo4flix.common.entity.Movie;
import com.neo4flix.movie.dto.MovieDetails;
import com.neo4flix.movie.dto.MoviePage;
import com.neo4flix.movie.dto.MovieSummary;
import com.neo4flix.movie.dto.MovieWriteRequest;
import com.neo4flix.movie.exception.MovieNotFoundException;
import com.neo4flix.movie.repository.MovieRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MovieService {

    private final MovieRepository repository;

    @Transactional(readOnly = true)
    public MoviePage findMovies(String search, String genre, Integer year, Pageable pageable) {
        if (pageable.getPageNumber() < 0) {
            throw new IllegalArgumentException("Page index must not be less than zero");
        }
        if (pageable.getPageSize() < 1 || pageable.getPageSize() > 100) {
            throw new IllegalArgumentException("Page size must be between 1 and 100");
        }

        Page<MovieSummary> movies = repository.searchMovies(
                normalize(search),
                normalize(genre),
                year,
                pageable).map(this::toSummary);

        return new MoviePage(
                movies.getContent(),
                movies.getTotalElements(),
                movies.getNumber(),
                movies.getSize(),
                movies.getTotalPages());
    }

    @Transactional
    public MovieDetails findById(String movieId, Long userId) {
        if (movieId == null || movieId.isBlank()) {
            throw new IllegalArgumentException("Movie ID cannot be empty");
        }

        String cleanMovieId = movieId.trim();
        if (userId != null) {
            return repository.findAndRecordView(cleanMovieId, userId)
                    .orElseThrow(() -> new MovieNotFoundException(cleanMovieId));
        }

        return repository.findByMovieId(cleanMovieId)
                .orElseThrow(() -> new MovieNotFoundException(cleanMovieId));
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "genres", unless = "#result.isEmpty()")
    public List<String> findGenres() {
        return repository.findGenreNames();
    }

    private MovieSummary toSummary(Movie movie) {
        return new MovieSummary(
                movie.getMovieId(),
                movie.getTitle(),
                movie.getYear(),
                movie.getReleased(),
                movie.getImdbRating(),
                movie.getPoster());
    }

    @Transactional
    public MovieDetails createOwnedMovie(Long userId, MovieWriteRequest request) {
        Long validUserId = requireUserId(userId);
        List<String> cleanGenres = cleanNames(request.genres());
        validateGenresExist(cleanGenres);

        String validatedPoster = mediaValidatorService.validatePosterUrl(request.poster());

        String movieId = UUID.randomUUID().toString();

        String createdId = repository.createOwnedMovie(
                validUserId,
                movieId,
                request.title().trim(),
                request.year(),
                normalize(request.released()),
                normalize(request.plot()),
                request.budget(),
                request.revenue(),
                request.runtime(),
                cleanNames(request.countries()),
                cleanNames(request.languages()),
                validatedPoster)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Authenticated user ID '" + validUserId + "' does not exist"));

        attachRelationships(validUserId, createdId, cleanGenres, cleanNames(request.actors()),
                cleanNames(request.directors()));

        return getOwnedMovieDetails(validUserId, createdId);
    }

    private String normalize(String value) {
        return value == null || value.isBlank()
                ? null
                : value.trim();
    }

    // Helpers

    private MovieDetails getOwnedMovieDetails(Long userId, String movieId) {
        return repository.findOwnedMovieDetails(userId, movieId)
                .orElseThrow(() -> new MovieNotFoundException(movieId));
    }

    private List<String> cleanNames(List<String> values) {
        if (values == null || values.isEmpty()) {
            return List.of();
        }
        Map<String, String> unique = new LinkedHashMap<>();
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                String trimmed = value.trim();
                unique.putIfAbsent(trimmed.toLowerCase(Locale.ROOT), trimmed);
            }
        }
        return new ArrayList<>(unique.values());
    }
}