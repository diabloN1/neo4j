package com.neo4flix.rating.service;

import com.neo4flix.rating.dto.RatingResponse;
import com.neo4flix.rating.dto.RatingAverageResponse;
import com.neo4flix.rating.exception.RatingNotFoundException;
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
        public RatingResponse rateMovie(String userId, String movieId, double value) {

                return ratingRepository.createOrUpdateRating(userId, movieId, value)
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "User or movie not found."));
        }

        public List<RatingResponse> getMyRatings(String userId) {
                return ratingRepository.findRatingsByUser(userId)
                                .stream()
                                .toList();
        }

        public RatingResponse getMyRating(String userId, String movieId) {
                return ratingRepository.findRating(userId, movieId)
                                .orElseThrow(() -> new RatingNotFoundException(
                                                "Rating not found for movie: " + movieId));
        }

        @Transactional
        public RatingResponse updateRating(
                        String userId,
                        String movieId,
                        double value) {

                return ratingRepository.updateExistingRating(
                                userId, movieId, value)
                                .orElseThrow(() -> new RatingNotFoundException(
                                                "Rating not found for movie: " + movieId));
        }

        @Transactional
        public void deleteRating(String userId, String movieId) {
                ratingRepository.deleteRating(userId, movieId);
        }

        public RatingAverageResponse getMovieRatingSummary(String movieId) {
                return ratingRepository.findRatingSummary(movieId)
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "Movie not found: " + movieId));
        }
}