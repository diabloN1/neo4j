package com.neo4flix.movie.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;
import org.springframework.data.repository.query.Param;

import com.neo4flix.common.entity.Movie;
import com.neo4flix.movie.dto.MovieDetails;

import java.util.List;
import java.util.Optional;

public interface MovieRepository extends Neo4jRepository<Movie, Long> {
    @Query("""
            MATCH (m:Movie {movieId: $movieId})

            CALL (m) {
                OPTIONAL MATCH (m)-[:IN_GENRE]->(g:Genre)
                RETURN collect(g.name) AS genreNames
            }

            CALL (m) {
                OPTIONAL MATCH (a:Actor)-[:ACTED_IN]->(m)
                RETURN collect(a.name) AS actorNames
            }

            CALL (m) {
                OPTIONAL MATCH (d:Director)-[:DIRECTED]->(m)
                RETURN collect(d.name) AS directorNames
            }

            RETURN m, genreNames, actorNames, directorNames
            """)
    Optional<MovieDetails> findByMovieId(@Param("movieId") String movieId);

    @Query("""
            MATCH (m:Movie {movieId: $movieId})
            MATCH (u:User {email: $email})

            MERGE (u)-[v:VIEWED]->(m)
            ON CREATE SET v.count = 1
            ON MATCH SET v.count = coalesce(v.count, 0) + 1

            CALL (m) {
                OPTIONAL MATCH (m)-[:IN_GENRE]->(g:Genre)
                RETURN collect(g.name) AS genreNames
            }

            CALL (m) {
                OPTIONAL MATCH (a:Actor)-[:ACTED_IN]->(m)
                RETURN collect(a.name) AS actorNames
            }

            CALL (m) {
                OPTIONAL MATCH (d:Director)-[:DIRECTED]->(m)
                RETURN collect(d.name) AS directorNames
            }

            RETURN m, genreNames, actorNames, directorNames
            """)
    Optional<MovieDetails> findAndRecordView(
            @Param("movieId") String movieId,
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
            ORDER BY m.imdbRating DESC, m.title ASC
            SKIP $skip
            LIMIT $limit
            """, countQuery = """
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