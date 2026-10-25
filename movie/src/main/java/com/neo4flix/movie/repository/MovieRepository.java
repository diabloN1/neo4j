package com.neo4flix.movie.repository;

import com.neo4flix.movie.entity.Movie;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MovieRepository extends Neo4jRepository<Movie, Long> {

        Optional<Movie> findFirstByTitleIgnoreCaseOrderByYearDesc(String title);

        Optional<Movie> findByMovieId(String movieId);

        boolean existsByMovieId(String movieId);

        @Query(value = """
                        MATCH (m:Movie)
                        WHERE ($search IS NULL OR
                               toLower(m.title) CONTAINS toLower($search))
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