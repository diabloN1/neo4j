package com.neo4flix.common.entity;

import java.time.Instant;

import org.springframework.data.neo4j.core.schema.RelationshipId;
import org.springframework.data.neo4j.core.schema.RelationshipProperties;
import org.springframework.data.neo4j.core.schema.TargetNode;

import lombok.Getter;
import lombok.Setter;

@RelationshipProperties
@Getter
@Setter
public class Watchlist {

    @RelationshipId
    private Long id;

    @TargetNode
    private Movie movie;

    private Instant createdAt = Instant.now();
}