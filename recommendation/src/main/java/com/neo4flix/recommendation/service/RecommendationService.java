package com.neo4flix.recommendation.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.neo4flix.recommendation.dto.MovieRecommendation;
import com.neo4flix.recommendation.repository.RecommendationRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RecommendationService {
    private final RecommendationRepository repo;

    public List<MovieRecommendation> getRecommendations(
            String email,
            String genre,
            Integer year,
            int skip,
            int limit) {
        if (skip < 0) {
            throw new IllegalArgumentException("Skip must not be negative.");
        }

        if (limit < 1 || limit > 100) {
            throw new IllegalArgumentException("Limit must be between 1 and 100.");
        }

        return repo.findRecommendations(email, genre, year, skip, limit);
    }

}
