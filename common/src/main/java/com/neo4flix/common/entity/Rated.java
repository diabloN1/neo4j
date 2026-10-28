package com.neo4flix.common.entity;

import org.springframework.data.neo4j.core.schema.Property;
import org.springframework.data.neo4j.core.schema.RelationshipId;
import org.springframework.data.neo4j.core.schema.RelationshipProperties;
import org.springframework.data.neo4j.core.schema.TargetNode;

import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@RelationshipProperties
@Getter 
@Setter 
public class Rated {

    @RelationshipId
    private Long id;

    @Property("rating")
    private double value;

    private Instant createdAt;

    private Instant updatedAt;

    @TargetNode
    private Movie movie;
}