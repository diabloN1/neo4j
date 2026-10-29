package com.neo4flix.recommendation.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.neo4flix.recommendation.dto.MovieRecommendation;
import com.neo4flix.recommendation.repository.RecommandationRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor  
public class RecommandationService {
    private final RecommandationRepository repo;

    public List<MovieRecommendation> getRecommandations(String email, String genre, Integer year, int skip, int limit) {
        return repo.findRecommendations(email, genre, year, skip, limit);
    }
    
}
