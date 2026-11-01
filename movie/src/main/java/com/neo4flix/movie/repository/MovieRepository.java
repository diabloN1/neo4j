package com.neo4flix.movie.repository;

import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;
import org.springframework.data.repository.query.Param;

import com.neo4flix.common.entity.Movie;
import com.neo4flix.movie.dto.MovieDetails;

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

}