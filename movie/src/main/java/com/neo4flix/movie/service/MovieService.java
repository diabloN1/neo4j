package com.neo4flix.movie.service;

import com.neo4flix.common.entity.Actor;
import com.neo4flix.common.entity.Director;
import com.neo4flix.common.entity.Genre;
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
                movies.getTotalPages()
        );
    }

    @Transactional(readOnly = true)
    public MovieDetails findByTitle(String title) {
        Movie movie = repository
                .findFirstByTitleIgnoreCaseOrderByYearDesc(title)
                .orElseThrow(() -> new MovieNotFoundException(title));

        return toDetails(movie);
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
                movie.getPoster()
        );
    }

    private MovieDetails toDetails(Movie movie) {
        return new MovieDetails(
                movie.getMovieId(),
                movie.getTitle(),
                movie.getYear(),
                movie.getReleased(),
                movie.getPlot(),
                movie.getBudget(),
                movie.getRevenue(),
                movie.getRuntime(),
                safeList(movie.getCountries()),
                safeList(movie.getLanguages()),
                movie.getImdbId(),
                movie.getImdbRating(),
                movie.getImdbVotes(),
                movie.getTmdbId(),
                movie.getPoster(),
                movie.getUrl(),
                namesOfGenres(movie.getGenres()),
                namesOfActors(movie.getActors()),
                namesOfDirectors(movie.getDirectors())
        );
    }

    private List<String> namesOfGenres(List<Genre> genres) {
        if (genres == null) {
            return List.of();
        }

        return genres.stream()
                .map(Genre::getName)
                .filter(name -> name != null && !name.isBlank())
                .distinct()
                .toList();
    }

    private List<String> namesOfActors(List<Actor> actors) {
        if (actors == null) {
            return List.of();
        }

        return actors.stream()
                .map(Actor::getName)
                .filter(name -> name != null && !name.isBlank())
                .distinct()
                .toList();
    }

    private List<String> namesOfDirectors(List<Director> directors) {
        if (directors == null) {
            return List.of();
        }

        return directors.stream()
                .map(Director::getName)
                .filter(name -> name != null && !name.isBlank())
                .distinct()
                .toList();
    }

    private List<String> safeList(List<String> values) {
        return values == null ? List.of() : List.copyOf(values);
    }

    private String normalize(String value) {
        return value == null || value.isBlank()
                ? null
                : value.trim();
    }
}