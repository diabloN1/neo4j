package com.neo4flix.common.entity;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import org.springframework.data.annotation.Version;
import org.springframework.data.neo4j.core.schema.GeneratedValue;
import org.springframework.data.neo4j.core.schema.Id;
import org.springframework.data.neo4j.core.schema.Node;
import org.springframework.data.neo4j.core.schema.Relationship;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Node("User")
@Getter
@Setter
@NoArgsConstructor
public class User {

    @Id
    @GeneratedValue
    private Long id;

    private String name;

    private String email;

    private String password;

    @Relationship(type = "WATCHLIST", direction = Relationship.Direction.OUTGOING)
    private List<Watchlist> watchlist = new ArrayList<>();

    private Instant createdAt = Instant.now();

    @Version
    private Long version;
}