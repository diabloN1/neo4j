package com.neo4flix.movie.controller;

import com.neo4flix.movie.dto.MovieDetails;
import com.neo4flix.movie.dto.MoviePage;
import com.neo4flix.movie.dto.MovieWriteRequest;
import com.neo4flix.movie.service.MovieService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@Validated
@RestController
@RequestMapping("/api/movies")
@RequiredArgsConstructor
public class MovieController {

    private final MovieService service;

    @GetMapping("/owned")
    public ResponseEntity<Page<MovieDetails>> findMyMovies(
            @AuthenticationPrincipal Jwt jwt,
            @PageableDefault(size = 20) Pageable pageable) {
        Long userId = extractUserId(jwt);
        return ResponseEntity.ok(service.findOwnedMovies(userId, pageable));
    }

    @GetMapping
    public ResponseEntity<MoviePage> findMovies(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String genre,
            @RequestParam(required = false) @Min(value = 1888, message = "Year must be 1888 or later") Integer year,
            @PageableDefault(size = 20) Pageable pageable) {

        String cleanSearch = (search != null && !search.isBlank()) ? search.trim() : null;
        String cleanGenre = (genre != null && !genre.isBlank()) ? genre.trim() : null;

        MoviePage movies = service.findMovies(cleanSearch, cleanGenre, year, pageable);
        return ResponseEntity.ok(movies);
    }

    @GetMapping("/genres")
    public ResponseEntity<List<String>> findGenres() {
        return ResponseEntity.ok(service.findGenres());
    }

    @GetMapping("/{id}")
    public ResponseEntity<MovieDetails> findById(
            @PathVariable @NotBlank(message = "Movie ID cannot be blank") String id,
            @AuthenticationPrincipal Jwt jwt) {

        Long userIdentifier = extractUserId(jwt);
        return ResponseEntity.ok(service.findById(id.trim(), userIdentifier));
    }

    @PostMapping
    public ResponseEntity<MovieDetails> createOwnedMovie(
            @Valid @RequestBody MovieWriteRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        Long userIdentifier = extractUserId(jwt);
        MovieDetails created = service.createOwnedMovie(userIdentifier, request);

        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(created.movieId())
                .toUri();

        return ResponseEntity.created(location).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<MovieDetails> updateOwnedMovie(
            @PathVariable @NotBlank(message = "Movie ID cannot be blank") String id,
            @Valid @RequestBody MovieWriteRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        Long userIdentifier = extractUserId(jwt);
        MovieDetails updated = service.updateOwnedMovie(userIdentifier, id.trim(), request);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOwnedMovie(
            @PathVariable @NotBlank(message = "Movie ID cannot be blank") String id,
            @AuthenticationPrincipal Jwt jwt) {

        Long userIdentifier = extractUserId(jwt);
        service.deleteOwnedMovie(userIdentifier, id.trim());
        return ResponseEntity.noContent().build();
    }

    private Long extractUserId(Jwt jwt) {
        if (jwt == null) {
            return null;
        }
        Object userIdClaim = jwt.getClaim("userId");
        if (userIdClaim instanceof Number number) {
            return number.longValue();
        }
        if (userIdClaim instanceof String str && !str.isBlank()) {
            return Long.parseLong(str.trim());
        }
        return null;
    }
}