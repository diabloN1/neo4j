package com.neo4flix.rating.repository;

import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;
import org.springframework.data.repository.query.Param;

import com.neo4flix.common.entity.User;
import com.neo4flix.rating.dto.RatingResponse;
import com.neo4flix.rating.dto.RatingAverageResponse;

import java.util.List;
import java.util.Optional;

public interface RatingRepository extends Neo4jRepository<User, Long> {

        @Query("""
                        MATCH (u:User {id: $userId})
                        MATCH (m:Movie {movieId: $movieId})
                        MERGE (u)-[r:RATED]->(m)
                        ON CREATE SET r.createdAt = datetime()
                        SET r.rating = $rating,
                            r.updatedAt = datetime()
                        RETURN m.movieId AS movieId,
                               r.rating AS rating,
                               toString(r.createdAt) AS createdAt,
                               toString(r.updatedAt) AS updatedAt
                        """)
        Optional<RatingResponse> createOrUpdateRating(
                        @Param("userId") String userId,
                        @Param("movieId") String movieId,
                        @Param("rating") double rating);

        @Query("""
                        MATCH (u:User {id: $userId})-[r:RATED]->
                              (m:Movie {movieId: $movieId})
                        RETURN m.movieId AS movieId,
                               r.rating AS rating,
                               toString(r.createdAt) AS createdAt,
                               toString(r.updatedAt) AS updatedAt
                        """)
        Optional<RatingResponse> findRating(
                        @Param("userId") String userId,
                        @Param("movieId") String movieId);

        @Query("""
                        MATCH (u:User {id: $userId})-[r:RATED]->(m:Movie)
                        RETURN m.movieId AS movieId,
                               r.rating AS rating,
                               toString(r.createdAt) AS createdAt,
                               toString(r.updatedAt) AS updatedAt
                        ORDER BY r.updatedAt DESC
                        """)
        List<RatingResponse> findRatingsByUser(
                        @Param("userId") String userId);

        @Query("""
                        MATCH (u:User {id: $userId})-[r:RATED]->
                              (m:Movie {movieId: $movieId})
                        SET r.rating = $rating,
                            r.updatedAt = datetime()
                        RETURN m.movieId AS movieId,
                               r.rating AS rating,
                               toString(r.createdAt) AS createdAt,
                               toString(r.updatedAt) AS updatedAt
                        """)
        Optional<RatingResponse> updateExistingRating(
                        @Param("userId") String userId,
                        @Param("movieId") String movieId,
                        @Param("rating") double rating);

        @Query("""
                        MATCH (u:User {id: $userId})-[r:RATED]->
                              (m:Movie {movieId: $movieId})
                        DELETE r
                        RETURN true AS deleted
                        """)
        void deleteRating(
                        @Param("userId") String userId,
                        @Param("movieId") String movieId);

        @Query("""
                        MATCH (m:Movie {movieId: $movieId})
                        OPTIONAL MATCH (:User)-[r:RATED]->(m)
                        RETURN m.movieId AS movieId,
                               coalesce(avg(r.rating), 0.0) AS averageRating,
                               count(r) AS ratingCount
                        """)
        Optional<RatingAverageResponse> findRatingSummary(
                        @Param("movieId") String movieId);
}