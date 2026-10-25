package com.neo4flix.movie.controller;

import com.neo4flix.movie.dto.MovieDetails;
import com.neo4flix.movie.dto.MoviePage;
import com.neo4flix.movie.service.MovieService;

import org.springframework.data.domain.Pageable;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/movies")
@Validated
public class MovieController {

    private final MovieService service;

    public MovieController(MovieService service) {
        this.service = service;
    }

    @GetMapping
    public MoviePage findMovies(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String genre,
            @RequestParam(required = false) Integer year,
            Pageable pageable
        ) {

        return service.findMovies(search, genre, year, pageable);
    }

    @GetMapping("/genres")
    public List<String> findGenres() {
        return service.findGenres();
    }

    @GetMapping("/{title}")
    public MovieDetails findByTitle(@PathVariable String title) {
        return service.findByTitle(title);
    }
}