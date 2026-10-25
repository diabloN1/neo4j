package com.neo4flix.user.exception;

public class UserNotFoundException extends RuntimeException {
    public UserNotFoundException(String id) {
        super("User with ID '" + id + "' not found.");
    }
}