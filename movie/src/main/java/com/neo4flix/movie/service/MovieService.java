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
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MovieService {

    private final MovieRepository repository;

    private final MediaValidatorService mediaValidatorService;

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

    @Transactional
    public MovieDetails updateOwnedMovie(Long userId, String movieId, MovieWriteRequest request) {
        Long validUserId = requireUserId(userId);
        if (movieId == null || movieId.isBlank()) {
            throw new IllegalArgumentException("Movie ID cannot be empty");
        }
        String cleanMovieId = movieId.trim();

        String validatedPoster = mediaValidatorService.validatePosterUrl(request.poster());

        List<String> cleanGenres = cleanNames(request.genres());
        validateGenresExist(cleanGenres);

        String updatedId = repository.updateOwnedMovie(
                validUserId,
                cleanMovieId,
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
                .orElseThrow(() -> new MovieNotFoundException("Movie not found or not owned by user: " + cleanMovieId));

        repository.clearOwnedGenres(validUserId, updatedId);
        repository.clearOwnedActors(validUserId, updatedId);
        repository.clearOwnedDirectors(validUserId, updatedId);

        attachRelationships(validUserId, updatedId, cleanGenres, cleanNames(request.actors()),
                cleanNames(request.directors()));

        return getOwnedMovieDetails(validUserId, updatedId);
    }

    @Transactional
    public void deleteOwnedMovie(Long userId, String movieId) {
        Long validUserId = requireUserId(userId);
        if (movieId == null || movieId.isBlank()) {
            throw new IllegalArgumentException("Movie ID cannot be empty");
        }
        String cleanMovieId = movieId.trim();

        boolean deleted = repository.deleteOwnedMovie(validUserId, cleanMovieId).orElse(false);
        if (!deleted) {
            throw new MovieNotFoundException("Movie not found or not owned by user: " + cleanMovieId);
        }
    }

    @Transactional(readOnly = true)
    public Page<MovieDetails> findOwnedMovies(Long userId, Pageable pageable) {
        Long validUserId = requireUserId(userId);

        if (pageable.getPageSize() < 1 || pageable.getPageSize() > 100) {
            throw new IllegalArgumentException("Page size must be between 1 and 100");
        }

        return repository.findOwnedMovies(validUserId, pageable);
    }

    // Helpers
    private String normalize(String value) {
        return value == null || value.isBlank()
                ? null
                : value.trim();
    }

    private void validateGenresExist(List<String> requestedGenres) {
        if (requestedGenres.isEmpty()) {
            return;
        }
        List<String> availableGenres = repository.findAllGenreNames();
        Set<String> availableSet = new HashSet<>();
        for (String g : availableGenres) {
            if (g != null)
                availableSet.add(g.trim().toLowerCase(Locale.ROOT));
        }

        for (String genre : requestedGenres) {
            if (!availableSet.contains(genre.toLowerCase(Locale.ROOT))) {
                throw new IllegalArgumentException("Invalid genre: " + genre);
            }
        }
    }

    private void attachRelationships(
            Long userId, String movieId, List<String> genres,
            List<String> actors, List<String> directors) {

        if (genres != null && !genres.isEmpty()) {
            repository.syncOwnedGenres(userId, movieId, genres);
        }
        if (actors != null && !actors.isEmpty()) {
            repository.syncOwnedActors(userId, movieId, actors);
        }
        if (directors != null && !directors.isEmpty()) {
            repository.syncOwnedDirectors(userId, movieId, directors);
        }
    }

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

    private Long requireUserId(Long userId) {
        if (userId == null) {
            throw new IllegalArgumentException("An authenticated user ID is required");
        }
        return userId;
    }
}