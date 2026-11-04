package com.neo4flix.user.dto;

import java.time.Instant;

public record UserRatingResponse(String movieId, String movieTitle, double rating, Instant createdAt,
        Instant updatedAt) {

}
