package com.neo4flix.rating.controller;

import com.neo4flix.rating.dto.RatingRequest;
import com.neo4flix.rating.dto.RatingResponse;
import com.neo4flix.rating.dto.RatingAverageResponse;
import com.neo4flix.rating.service.RatingService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ratings")
@RequiredArgsConstructor
public class RatingController {

    private final RatingService ratingService;

    @PostMapping("/{movieId}")
    @ResponseStatus(HttpStatus.CREATED)
    public RatingResponse rateMovie(
            @PathVariable String movieId,
            @Valid @RequestBody RatingRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        String email = jwt.getSubject();

        return ratingService.rateMovie(email, movieId, request.rating());
    }

    @GetMapping("/me")
    public List<RatingResponse> getMyRatings(
            @AuthenticationPrincipal Jwt jwt) {

        String email = jwt.getSubject();

        return ratingService.getMyRatings(email);
    }

    @GetMapping("/{movieId}")
    public RatingResponse getMyRating(
            @PathVariable String movieId,
            @AuthenticationPrincipal Jwt jwt) {

        String email = jwt.getSubject();

        return ratingService.getMyRating(email, movieId);
    }

    @DeleteMapping("/{movieId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteRating(
            @PathVariable String movieId,
            @AuthenticationPrincipal Jwt jwt) {

        String email = jwt.getSubject();

        ratingService.deleteRating(email, movieId);
    }

    @GetMapping("/movies/{movieId}/average")
    public RatingAverageResponse getMovieRatingAverage(
            @PathVariable String movieId) {

        return ratingService.getMovieRatingAverage(movieId);
    }
}