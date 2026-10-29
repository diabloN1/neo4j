package com.neo4flix.movie.service;

import com.neo4flix.common.entity.Movie;
import com.neo4flix.movie.dto.MovieDetails;
import com.neo4flix.movie.dto.MoviePage;
import com.neo4flix.movie.dto.MovieSummary;
import com.neo4flix.movie.exception.MovieNotFoundException;
import com.neo4flix.movie.repository.MovieRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class MovieService {

    private final MovieRepository repository;

    public MovieService(MovieRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public MoviePage findMovies(
            String search,
            String genre,
            Integer year,
            Pageable pageable) {

        if (pageable.getPageNumber() < 0) {
            throw new IllegalArgumentException(
                    "Page must be zero or greater");
        }

        if (pageable.getPageSize() < 1
                || pageable.getPageSize() > 100) {
            throw new IllegalArgumentException(
                    "Size must be between 1 and 100");
        }

        Page<MovieSummary> movies = repository.searchMovies(
                normalize(search),
                normalize(genre),
                year,
                pageable)
                .map(this::toSummary);

        return new MoviePage(
                movies.getContent(),
                movies.getTotalElements(),
                movies.getNumber(),
                movies.getSize(),
                movies.getTotalPages());
    }

    @Transactional
    public MovieDetails findById(String id, String email) {
        MovieDetails movie;

        if (email != null) {
            movie = repository.findAndRecordView(id, email)
                    .orElseThrow(() -> new MovieNotFoundException(id));
        } else {
            movie = repository
                    .findByMovieId(id)
                    .orElseThrow(() -> new MovieNotFoundException(id));
        }

        return movie;
    }

    @Transactional(readOnly = true)
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

    private String normalize(String value) {
        return value == null || value.isBlank()
                ? null
                : value.trim();
    }
}