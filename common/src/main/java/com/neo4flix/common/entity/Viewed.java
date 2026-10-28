package com.neo4flix.common.entity;

import org.springframework.data.neo4j.core.schema.RelationshipId;
import org.springframework.data.neo4j.core.schema.RelationshipProperties;
import org.springframework.data.neo4j.core.schema.TargetNode;

import lombok.Getter;
import lombok.Setter;

@RelationshipProperties
@Getter 
@Setter 
public class Viewed {

    @RelationshipId
    private Long id;

    private Integer count; 

    @TargetNode
    private Movie movie;
}