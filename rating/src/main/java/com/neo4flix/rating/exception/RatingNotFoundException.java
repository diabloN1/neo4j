package com.neo4flix.rating.exception;

public class RatingNotFoundException extends RuntimeException {
    public RatingNotFoundException(String title) {
        super("Rating not found: " + title);
    }
}
