package com.neo4flix.movie.service;

import com.neo4flix.common.entity.Movie;
import com.neo4flix.movie.dto.MoviePage;
import com.neo4flix.movie.repository.WatchlistRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WatchlistService {

    private final WatchlistRepository watchlistRepository;

    @Transactional(readOnly = true)
    public MoviePage<Movie> findMoviesByUser(String email, int page, int size) {

        if (page < 0) {
            throw new IllegalArgumentException("Page index must not be negative.");
        }

        if (size < 1 || size > 100) {
            throw new IllegalArgumentException("Page size must be between 1 and 100.");
        }

        int skip = page * size;

        List<Movie> movies = watchlistRepository.findMoviesByUser(
                email, skip, size);

        long totalElements = watchlistRepository.countMoviesByUser(email);

        int totalPages = (int) Math.ceil((double) totalElements / size);

        return new MoviePage<>(
                movies,
                totalElements,
                page,
                size,
                totalPages);
    }

    @Transactional(readOnly = true)
    public boolean inWatchList(String email, String movieId) {
        return watchlistRepository.inWatchList(email, movieId);
    }

    @Transactional
    public void addWatchlist(String email, String movieId) {
        watchlistRepository.addWatchlist(email, movieId);
    }

    @Transactional
    public void removeWatchlist(String email, String movieId) {
        watchlistRepository.removeWatchlist(email, movieId);
    }
}