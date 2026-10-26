package com.neo4flix.common.entity;

import org.springframework.data.neo4j.core.schema.Property;
import org.springframework.data.neo4j.core.schema.RelationshipId;
import org.springframework.data.neo4j.core.schema.RelationshipProperties;
import org.springframework.data.neo4j.core.schema.TargetNode;

import java.time.ZonedDateTime;

@RelationshipProperties
public class Rating {

    @RelationshipId
    private Long id;

    @Property("rating")
    private double value;

    @Property("createdAt")
    private ZonedDateTime createdAt;

    @Property("updatedAt")
    private ZonedDateTime updatedAt;

    @TargetNode
    private Movie movie;

    public Rating() {
    }

    public Rating(
            double value,
            ZonedDateTime createdAt,
            ZonedDateTime updatedAt,
            Movie movie
    ) {
        this.value = value;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.movie = movie;
    }

    public Long getId() {
        return id;
    }

    public double getValue() {
        return value;
    }

    public void setValue(double value) {
        this.value = value;
    }

    public ZonedDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(ZonedDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public ZonedDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(ZonedDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Movie getMovie() {
        return movie;
    }

    public void setMovie(Movie movie) {
        this.movie = movie;
    }
}