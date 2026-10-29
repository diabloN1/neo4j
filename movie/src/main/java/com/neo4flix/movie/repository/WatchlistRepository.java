package com.neo4flix.movie.repository;

import com.neo4flix.common.entity.Movie;

import org.springframework.data.neo4j.repository.query.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WatchlistRepository {

        @Query("""
                        MATCH (u:User {email: $email})-[w:WATCHLIST]->(m:Movie)

                        RETURN m ORDER BY w.createdAt DESC
                        """)
        List<Movie> findMoviesByUser(@Param("email") String email);

        @Query("""
                        RETURN EXISTS {
                            MATCH (:User {email: $email})-[:WATCHLIST]->(:Movie {movieId: $movieId})
                        } AS inWatchlist
                        """)
        boolean inWatchList(
                        @Param("email") String email,
                        @Param("movieId") String movieId);

        @Query("""
                        MATCH (u:User {email: $email})
                        MATCH (m:Movie {movieId: $movieId})

                        MERGE (u)-[w:WATCHLIST]->(m)
                        ON CREATE SET r.createdAt = datetime()

                        RETURN true AS success
                        """)
        void addWatchlist(
                        @Param("email") String email,
                        @Param("movieId") String movieId);

        @Query("""
                        MATCH (u:User {email: $email})-[r:WATCHLIST]->(m:Movie {movieId: $movieId})
                        DELETE r

                        RETURN true AS success
                        """)
        void removeWatchlist(
                        @Param("email") String email,
                        @Param("movieId") String movieId);
}