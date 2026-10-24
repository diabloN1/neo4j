package com.neo4flix.movie.entity;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.neo4j.core.schema.GeneratedValue;
import org.springframework.data.neo4j.core.schema.Id;
import org.springframework.data.neo4j.core.schema.Node;
import org.springframework.data.neo4j.core.schema.Property;
import org.springframework.data.neo4j.core.schema.Relationship;

import java.util.ArrayList;
import java.util.List;

@Node("Movie")
@Getter 
@Setter 
@NoArgsConstructor
public class Movie {

    @Id
    @GeneratedValue
    private Long id;

    @Property("movieId")
    private String movieId;

    private String title;
    private Integer year;
    private String released;
    private String plot;

    private Long budget;
    private Long revenue;
    private Integer runtime;

    private List<String> countries = new ArrayList<>();
    private List<String> languages = new ArrayList<>();

    private String imdbId;
    private Double imdbRating;
    private Long imdbVotes;

    private String tmdbId;
    private String poster;
    private String url;

    @Relationship(type = "IN_GENRE", direction = Relationship.Direction.OUTGOING)
    private List<Genre> genres = new ArrayList<>();

    @Relationship(type = "ACTED_IN", direction = Relationship.Direction.INCOMING)
    private List<Actor> actors = new ArrayList<>();

    @Relationship(type = "DIRECTED", direction = Relationship.Direction.INCOMING)
    private List<Director> directors = new ArrayList<>();
}