package com.neo4flix.rating.service;

import com.neo4flix.rating.dto.RatingResponse;
import com.neo4flix.rating.dto.RatingAverageResponse;
import com.neo4flix.rating.repository.RatingRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RatingService {

        private final RatingRepository ratingRepository;

        @Transactional
        public RatingResponse rateMovie(String userEmail, String movieId, double value) {

                System.out.println(movieId + "-----" + userEmail);
                return ratingRepository.createOrUpdateRating(userEmail, movieId, value)
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "User or movie not found."));
        }

        public List<RatingResponse> getMyRatings(String userEmail) {
                return ratingRepository.findRatingsByUser(userEmail)
                                .stream()
                                .toList();
        }

        public RatingResponse getMyRating(String userEmail, String movieId) {
                return ratingRepository.findRating(userEmail, movieId)
                                .orElse(
                                                new RatingResponse(
                                                                movieId,
                                                                0.0,
                                                                null,
                                                                null));
        }

        @Transactional
        public void deleteRating(String userEmail, String movieId) {
                ratingRepository.deleteRating(userEmail, movieId);
        }

        public RatingAverageResponse getMovieRatingAverage(String movieId) {
                return ratingRepository.findRatingAverage(movieId)
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "Movie not found: " + movieId));
        }
}