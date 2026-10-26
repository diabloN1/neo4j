package com.neo4flix.rating.repository;

import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;
import org.springframework.data.repository.query.Param;

import com.neo4flix.common.entity.Rating;
import com.neo4flix.rating.dto.RatingResponse;
import com.neo4flix.rating.dto.RatingAverageResponse;

import java.util.List;
import java.util.Optional;

public interface RatingRepository extends Neo4jRepository<Rating, Long> {

        @Query("""
                        MATCH (u:User {email: $email})
                        MATCH (m:Movie {movieId: $movieId})
                        MERGE (u)-[r:RATED]->(m)
                        ON CREATE SET r.createdAt = datetime()
                        SET r.rating = $rating,
                            r.updatedAt = datetime()
                        RETURN m.movieId AS movieId,
                               r.rating AS rating,
                               r.createdAt AS createdAt,
                               r.updatedAt AS updatedAt
                        """)
        Optional<RatingResponse> createOrUpdateRating(
                        @Param("email") String email,
                        @Param("movieId") String movieId,
                        @Param("rating") double rating);

        @Query("""
                        MATCH (u:User {id: $email})-[r:RATED]->
                              (m:Movie {movieId: $movieId})
                        RETURN m.movieId AS movieId,
                               r.rating AS rating,
                               r.createdAt AS createdAt,
                               r.updatedAt AS updatedAt
                        """)
        Optional<RatingResponse> findRating(
                        @Param("email") String email,
                        @Param("movieId") String movieId);

        @Query("""
                        MATCH (u:User {id: $email})-[r:RATED]->(m:Movie)
                        RETURN m.movieId AS movieId,
                               r.rating AS rating,
                               r.createdAt AS createdAt,
                               r.updatedAt AS updatedAt
                        ORDER BY r.updatedAt DESC
                        """)
        List<RatingResponse> findRatingsByUser(
                        @Param("email") String email);

        @Query("""
                        MATCH (u:User {id: $email})-[r:RATED]->
                              (m:Movie {movieId: $movieId})
                        DELETE r
                        RETURN true AS deleted
                        """)
        void deleteRating(
                        @Param("email") String email,
                        @Param("movieId") String movieId);

        @Query("""
                        MATCH (m:Movie {movieId: $movieId})
                        OPTIONAL MATCH (:User)-[r:RATED]->(m)
                        RETURN m.movieId AS movieId,
                               coalesce(avg(r.rating), 0.0) AS averageRating,
                               count(r) AS ratingCount
                        """)
        Optional<RatingAverageResponse> findRatingAverage(
                        @Param("movieId") String movieId);
}