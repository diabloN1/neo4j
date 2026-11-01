package com.neo4flix.movie.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import java.util.List;

public record MovieWriteRequest(
                @NotBlank(message = "Title is required") String title,

                @Min(value = 1888, message = "Year must be 1888 or later") Integer year,

                String released,
                String plot,

                @PositiveOrZero(message = "Budget cannot be negative") Long budget,

                @PositiveOrZero(message = "Revenue cannot be negative") Long revenue,

                @PositiveOrZero(message = "Runtime cannot be negative") Integer runtime,

                List<String> countries,
                List<String> languages,
                String poster,
                List<String> genres,
                List<String> actors,
                List<String> directors) {

        public MovieWriteRequest {
                genres = genres == null ? List.of() : genres;
                actors = actors == null ? List.of() : actors;
                directors = directors == null ? List.of() : directors;
                countries = countries == null ? List.of() : countries;
                languages = languages == null ? List.of() : languages;
        }
}