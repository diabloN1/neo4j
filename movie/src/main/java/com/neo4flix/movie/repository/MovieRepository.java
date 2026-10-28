package com.neo4flix.movie.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;
import org.springframework.data.repository.query.Param;

import com.neo4flix.common.entity.Movie;

import java.util.List;
import java.util.Optional;

public interface MovieRepository extends Neo4jRepository<Movie, Long> {

        Optional<Movie> findByMovieId(String movieId);

        @Query("""
                MATCH (u:User {email: $email})
                MATCH (m:Movie {movieId: $movieId})
                MERGE (u)-[v:VIEWED]->(m)
                ON CREATE SET v.count = 1
                ON MATCH SET v.count = coalesce(v.count, 0) + 1
                RETURN m
                """)
        Optional<Movie> findAndRecordView(
                @Param("userId") String userId,
                @Param("email") String email);

        @Query(value = """
                        MATCH (m:Movie)
                        WHERE ($search IS NULL OR
                               toLower(m.title) CONTAINS toLower($search) OR
                               toString(m.year) CONTAINS toString($search) OR
                               toString(m.plot) CONTAINS toString($search))

                          AND ($year IS NULL OR m.year = $year)
                          AND ($genre IS NULL OR EXISTS {
                              MATCH (m)-[:IN_GENRE]->(g:Genre)
                              WHERE toLower(g.name) = toLower($genre)
                          })
                        RETURN m
                        ORDER BY m.title
                        SKIP $skip
                        LIMIT $limit
                        """, countQuery = """
                        MATCH (m:Movie)
                        WHERE ($search IS NULL OR
                               toLower(m.title) CONTAINS toLower($search))
                          AND ($year IS NULL OR m.year = $year)
                          AND ($genre IS NULL OR EXISTS {
                              MATCH (m)-[:IN_GENRE]->(g:Genre)
                              WHERE toLower(g.name) = toLower($genre)
                          })
                        RETURN count(m)
                        """)
        Page<Movie> searchMovies(
                        @Param("search") String search,
                        @Param("genre") String genre,
                        @Param("year") Integer year,
                        Pageable pageable);

        @Query("""
                        MATCH (:Movie)-[:IN_GENRE]->(g:Genre)
                        RETURN DISTINCT g.name AS name
                        ORDER BY name
                        """)
        List<String> findGenreNames();
}