package com.neo4flix.movie.exception;

public class MovieNotFoundException extends RuntimeException {
    public MovieNotFoundException(String title) {
        super("Movie not found: " + title);
    }
}
