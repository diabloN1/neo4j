package com.neo4flix.recommendation.controller;

import java.util.List;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.neo4flix.recommendation.dto.MovieRecommendation;
import com.neo4flix.recommendation.service.RecommendationService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/recommendations")
public class RecommendationController {
    private final RecommendationService service;

    @GetMapping
    public List<MovieRecommendation> findRecommendations(
            @RequestParam(required = false) String genre,
            @RequestParam(required = false) Integer year,
            @RequestParam(defaultValue = "0") Integer skip,
            @RequestParam(defaultValue = "0") Integer limit,
            @AuthenticationPrincipal Jwt jwt) {

        String email = jwt.getSubject();

        return service.getRecommandations(email, genre, year, skip, limit);
    }

}
