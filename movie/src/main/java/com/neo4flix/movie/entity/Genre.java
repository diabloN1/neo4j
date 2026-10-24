package com.neo4flix.movie.entity;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.neo4j.core.schema.GeneratedValue;
import org.springframework.data.neo4j.core.schema.Id;
import org.springframework.data.neo4j.core.schema.Node;

@Node("Genre")
@Getter
@Setter
@NoArgsConstructor
public class Genre {

    @Id
    @GeneratedValue
    private Long id;

    private String name;
}