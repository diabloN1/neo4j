package com.neo4flix.movie.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;
import org.springframework.data.repository.query.Param;

import com.neo4flix.common.entity.Movie;
import com.neo4flix.movie.dto.MovieDetails;

import java.util.Collection;
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
                        MATCH (u:User) WHERE id(u) = $userId

                        MERGE (u)-[v:VIEWED]->(m)
                        ON CREATE SET v.count = 1, v.lastViewedAt = datetime()
                        ON MATCH SET v.count = coalesce(v.count, 0) + 1, v.lastViewedAt = datetime()

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
                        @Param("userId") Long userId);

        @Query("""
                        MATCH (:Movie)-[:IN_GENRE]->(g:Genre)
                        WHERE g.name IS NOT NULL
                        RETURN DISTINCT g.name AS name
                        ORDER BY name
                        """)
        List<String> findGenreNames();

        @Query(value = """
                        MATCH (m:Movie)
                        WHERE ($search IS NULL OR
                               toLower(m.title) CONTAINS toLower($search) OR
                               toString(m.year) CONTAINS toString($search) OR
                               toLower(m.plot) CONTAINS toLower($search))

                          AND ($year IS NULL OR m.year = $year)
                          AND ($genre IS NULL OR EXISTS {
                              MATCH (m)-[:IN_GENRE]->(g:Genre)
                              WHERE toLower(g.name) = toLower($genre)
                          })

                        RETURN m

                        ORDER BY
                            CASE WHEN m.imdbRating IS NULL THEN 1 ELSE 0 END ASC,
                            (coalesce(m.imdbRating, 0.0) * coalesce(m.imdbVotes, 1)) DESC,
                            m.title ASC

                        SKIP $skip
                        LIMIT $limit
                        """, countQuery = """
                        MATCH (m:Movie)
                        WHERE ($search IS NULL OR
                               toLower(m.title) CONTAINS toLower($search) OR
                               toString(m.year) CONTAINS toString($search) OR
                               toLower(m.plot) CONTAINS toLower($search))

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

        @Query("MATCH (g:Genre) WHERE g.name IS NOT NULL RETURN DISTINCT g.name AS name ORDER BY name")
        List<String> findAllGenreNames();

        @Query("""
                        MATCH (u:User) WHERE id(u) = $userId
                        CREATE (m:Movie {
                            movieId: $movieId, title: $title, year: $year, released: $released,
                            plot: $plot, budget: $budget, revenue: $revenue, runtime: $runtime,
                            countries: $countries, languages: $languages, poster: $poster
                        })
                        CREATE (u)-[:OWNS]->(m)
                        RETURN m.movieId AS movieId
                        """)
        Optional<String> createOwnedMovie(
                        @Param("userId") Long userId,
                        @Param("movieId") String movieId,
                        @Param("title") String title,
                        @Param("year") Integer year,
                        @Param("released") String released,
                        @Param("plot") String plot,
                        @Param("budget") Long budget,
                        @Param("revenue") Long revenue,
                        @Param("runtime") Integer runtime,
                        @Param("countries") Collection<String> countries,
                        @Param("languages") Collection<String> languages,
                        @Param("poster") String poster);

        @Query("""
                        MATCH (u:User)-[:OWNS]->(m:Movie {movieId: $movieId})
                        WHERE id(u) = $userId
                        SET m.title = $title, m.year = $year, m.released = $released,
                            m.plot = $plot, m.budget = $budget, m.revenue = $revenue,
                            m.runtime = $runtime, m.countries = $countries,
                            m.languages = $languages, m.poster = $poster
                        RETURN m.movieId AS movieId
                        """)
        Optional<String> updateOwnedMovie(
                        @Param("userId") Long userId,
                        @Param("movieId") String movieId,
                        @Param("title") String title,
                        @Param("year") Integer year,
                        @Param("released") String released,
                        @Param("plot") String plot,
                        @Param("budget") Long budget,
                        @Param("revenue") Long revenue,
                        @Param("runtime") Integer runtime,
                        @Param("countries") Collection<String> countries,
                        @Param("languages") Collection<String> languages,
                        @Param("poster") String poster);

        @Query("""
                        MATCH (u:User)-[:OWNS]->(m:Movie {movieId: $movieId})
                        WHERE id(u) = $userId
                        DETACH DELETE m
                        RETURN true AS deleted
                        """)
        Optional<Boolean> deleteOwnedMovie(
                        @Param("userId") Long userId,
                        @Param("movieId") String movieId);

        @Query("""
                        MATCH (u:User)-[:OWNS]->(m:Movie {movieId: $movieId})
                        WHERE id(u) = $userId
                        CALL (m) { OPTIONAL MATCH (m)-[:IN_GENRE]->(g:Genre) RETURN collect(g.name) AS genreNames }
                        CALL (m) { OPTIONAL MATCH (a:Actor)-[:ACTED_IN]->(m) RETURN collect(a.name) AS actorNames }
                        CALL (m) { OPTIONAL MATCH (d:Director)-[:DIRECTED]->(m) RETURN collect(d.name) AS directorNames }
                        RETURN m, genreNames, actorNames, directorNames
                        """)
        Optional<MovieDetails> findOwnedMovieDetails(
                        @Param("userId") Long userId,
                        @Param("movieId") String movieId);

        @Query("""
                        MATCH (u:User)-[:OWNS]->(m:Movie)
                        WHERE id(u) = $userId
                        CALL (m) { OPTIONAL MATCH (m)-[:IN_GENRE]->(g:Genre) RETURN collect(g.name) AS genreNames }
                        CALL (m) { OPTIONAL MATCH (a:Actor)-[:ACTED_IN]->(m) RETURN collect(a.name) AS actorNames }
                        CALL (m) { OPTIONAL MATCH (d:Director)-[:DIRECTED]->(m) RETURN collect(d.name) AS directorNames }
                        RETURN m, genreNames, actorNames, directorNames
                        ORDER BY m.year DESC, m.title ASC
                        """)
        List<MovieDetails> findOwnedMovies(@Param("userId") Long userId);

        @Query("""
                        MATCH (u:User)-[:OWNS]->(m:Movie {movieId: $movieId})
                        WHERE id(u) = $userId
                        OPTIONAL MATCH (m)-[r:IN_GENRE]->()
                        DELETE r
                        RETURN count(r)
                        """)
        void clearOwnedGenres(@Param("userId") Long userId, @Param("movieId") String movieId);

        @Query("""
                        MATCH (u:User)-[:OWNS]->(m:Movie {movieId: $movieId})
                        WHERE id(u) = $userId
                        UNWIND $genres AS genreName
                        MATCH (g:Genre) WHERE toLower(trim(g.name)) = toLower(trim(genreName))
                        MERGE (m)-[:IN_GENRE]->(g)
                        """)
        void syncOwnedGenres(
                        @Param("userId") Long userId,
                        @Param("movieId") String movieId,
                        @Param("genres") Collection<String> genres);

        @Query("""
                        MATCH (u:User)-[:OWNS]->(m:Movie {movieId: $movieId})
                        WHERE id(u) = $userId
                        OPTIONAL MATCH (m)-[r:ACTED_IN]-()
                        DELETE r
                        RETURN count(r)
                        """)
        void clearOwnedActors(@Param("userId") Long userId, @Param("movieId") String movieId);

        @Query("""
                        MATCH (u:User)-[:OWNS]->(m:Movie {movieId: $movieId})
                        WHERE id(u) = $userId
                        UNWIND $actors AS actorName
                        WITH m, trim(actorName) AS cleanName
                        OPTIONAL MATCH (existing:Actor) WHERE toLower(trim(existing.name)) = toLower(cleanName)
                        WITH m, coalesce(existing.name, cleanName) AS finalName
                        MERGE (a:Actor {name: finalName})
                        MERGE (a)-[:ACTED_IN]->(m)
                        """)
        void syncOwnedActors(
                        @Param("userId") Long userId,
                        @Param("movieId") String movieId,
                        @Param("actors") Collection<String> actors);

        @Query("""
                        MATCH (u:User)-[:OWNS]->(m:Movie {movieId: $movieId})
                        WHERE id(u) = $userId
                        OPTIONAL MATCH (m)-[r:DIRECTED]-()
                        DELETE r
                        RETURN count(r)
                        """)
        void clearOwnedDirectors(@Param("userId") Long userId, @Param("movieId") String movieId);

        @Query("""
                        MATCH (u:User)-[:OWNS]->(m:Movie {movieId: $movieId})
                        WHERE id(u) = $userId
                        UNWIND $directors AS directorName
                        WITH m, trim(directorName) AS cleanName
                        OPTIONAL MATCH (existing:Director) WHERE toLower(trim(existing.name)) = toLower(cleanName)
                        WITH m, coalesce(existing.name, cleanName) AS finalName
                        MERGE (d:Director {name: finalName})
                        MERGE (d)-[:DIRECTED]->(m)
                        """)
        void syncOwnedDirectors(
                        @Param("userId") Long userId,
                        @Param("movieId") String movieId,
                        @Param("directors") Collection<String> directors);

}