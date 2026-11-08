package com.neo4flix.movie.controller;

import com.neo4flix.common.entity.Movie;
import com.neo4flix.movie.dto.MoviePage;
import com.neo4flix.movie.service.WatchlistService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/watchlist")
@RequiredArgsConstructor
public class WatchlistController {

    private final WatchlistService watchlistService;

    @GetMapping
    public ResponseEntity<MoviePage<Movie>> findMoviesByUser(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        return ResponseEntity.ok(
                watchlistService.findMoviesByUser(
                        jwt.getSubject(), page, size));
    }

    @GetMapping("/{movieId}/exists")
    public ResponseEntity<Boolean> inWatchList(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String movieId) {

        return ResponseEntity.ok(
                watchlistService.inWatchList(jwt.getSubject(), movieId));
    }

    @PostMapping("/{movieId}")
    public ResponseEntity<Void> addWatchlist(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String movieId) {

        watchlistService.addWatchlist(jwt.getSubject(), movieId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{movieId}")
    public ResponseEntity<Void> removeWatchlist(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String movieId) {

        watchlistService.removeWatchlist(jwt.getSubject(), movieId);
        return ResponseEntity.noContent().build();
    }
}