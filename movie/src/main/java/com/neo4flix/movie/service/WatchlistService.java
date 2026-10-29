package com.neo4flix.movie.service;

import com.neo4flix.common.entity.Movie;
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
    public List<Movie> findMoviesByUser(String email) {
        return watchlistRepository.findMoviesByUser(email);
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