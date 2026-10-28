package com.neo4flix.recommendation.repository;

import org.springframework.data.neo4j.repository.Neo4jRepository;

import com.neo4flix.common.entity.Movie;


public interface MovieRepository extends Neo4jRepository<Movie, Long> {
        
}