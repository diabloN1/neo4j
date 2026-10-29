package com.neo4flix.recommendation.repository;

import com.neo4flix.common.entity.Movie;
import com.neo4flix.recommendation.dto.MovieRecommendation;

import java.util.List;

import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;
import org.springframework.data.repository.query.Param;

public interface RecommendationRepository extends Neo4jRepository<Movie, Long> {

    @Query("""
            MATCH (u:User {email: $email})

            CALL {
                WITH u
                MATCH (u)-[v:VIEWED]->(m:Movie)
                RETURN m, toFloat(v.count) AS preference

                UNION ALL

                WITH u
                MATCH (u)-[:WATCHLIST]->(m:Movie)
                RETURN m, 5.0 AS preference

                UNION ALL

                WITH u
                MATCH (u)-[r:RATED]->(m:Movie)
                RETURN m, 10.0 * (r.rating - 2.5) AS preference
            }

            WITH u, m, sum(preference) AS preference

            MATCH (candidate:Movie)
            WHERE candidate <> m
            
                AND ($year IS NULL OR candidate.year = $year)

                AND ($genre IS NULL OR EXISTS {
                    MATCH (candidate)-[:IN_GENRE]->(g:Genre)
                    WHERE toLower(g.name) = toLower($genre)
                })

            WITH u, m, candidate, preference,

                [(m)<-[:ACTED_IN]-(a:Actor)
                    WHERE (candidate)<-[:ACTED_IN]-(a)
                    | a] AS sharedActors,

                [(m)<-[:DIRECTED]-(d:Director)
                    WHERE (candidate)<-[:DIRECTED]-(d)
                    | d] AS sharedDirectors,

                [(m)-[:IN_GENRE]->(g:Genre)
                    WHERE (candidate)-[:IN_GENRE]->(g)
                    | g] AS sharedGenres,

                [language IN coalesce(m.languages, [])
                    WHERE language IN coalesce(candidate.languages, [])
                    | language] AS sharedLanguages

            WITH u, m, candidate, preference,

                size(sharedActors)
                + size(sharedDirectors)
                + CASE
                    WHEN m.year IS NOT NULL
                        AND m.year = candidate.year
                    THEN 3
                    ELSE 0
                  END
                + 5 * size(sharedLanguages)
                + 10 * size(sharedGenres) AS similarity

            WITH u, candidate,
                 sum(preference * similarity) AS score

            WHERE score > 0

            AND NOT EXISTS {
                MATCH (u)-[:VIEWED|WATCHLIST|RATED]->(candidate)
            }

            RETURN
                candidate.movieId AS movieId,
                candidate.title AS title,
                candidate.year AS year,
                candidate.imdbRating AS imdbRating,
                candidate.poster AS poster,
                score AS score

            ORDER BY score DESC
            SKIP $skip
            LIMIT $limit
            """)
    List<MovieRecommendation> findRecommendations(
            @Param("email") String email,
            @Param("genre") String genre,
            @Param("year") Integer year,
            @Param("skip") int skip,
            @Param("limit") int limit);
}