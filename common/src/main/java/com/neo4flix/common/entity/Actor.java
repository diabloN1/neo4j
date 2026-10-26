package com.neo4flix.common.entity;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.neo4j.core.schema.GeneratedValue;
import org.springframework.data.neo4j.core.schema.Id;
import org.springframework.data.neo4j.core.schema.Node;

@Node("Actor")
@Getter
@Setter
@NoArgsConstructor
public class Actor {

    @Id
    @GeneratedValue
    private Long id;

    private String name;
}