import { CommonModule } from "@angular/common";
import { Component, OnInit, inject, signal } from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { finalize } from "rxjs";

import { Movie } from "../../models/movie.model";
import { MovieService } from "../../services/movie.service";
import { ZardBadgeComponent } from "@/shared/components/badge/badge.component";
import { ZardButtonComponent } from "@/shared/components/button/button.component";
import { ZardCardImports } from "@/shared/components/card/card.imports";

@Component({
  selector: "app-movie-detail-page",
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ZardBadgeComponent,
    ZardButtonComponent,
    ZardCardImports,
  ],
  templateUrl: "./movie-detail-page.component.html",
})
export class MovieDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly movieService = inject(MovieService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly movie = signal<Movie | null>(null);
  readonly loading = signal(true);
  readonly error = signal("");
  readonly posterFailed = signal(false);
  readonly playerOpen = signal(false);

  readonly playerUrl = signal<SafeResourceUrl | null>(null);

  ngOnInit(): void {
    const title = this.route.snapshot.paramMap.get("title");

    if (!title) {
      this.error.set("No movie title was provided.");
      this.loading.set(false);
      return;
    }

    this.movieService
      .getMovieByTitle(title)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (movie) => {
          this.movie.set(movie);

          const tmdbId = movie.tmdbId?.trim();

          if (tmdbId) {
            const url = `https://vidy.st/movie/${tmdbId}?color=DC2626&autoplay=true`;

            this.playerUrl.set(
              this.sanitizer.bypassSecurityTrustResourceUrl(url),
            );
          }
        },
        error: (error) =>
          this.error.set(
            error.status === 404
              ? "We could not find that movie."
              : error.status === 0
                ? "Cannot reach the Movie API at http://localhost:8081. Check the backend and its CORS configuration."
                : `Could not load movie details${
                    error.status ? ` (${error.status})` : ""
                  }.`,
          ),
      });
  }

  playMovie(): void {
    if (this.playerUrl()) {
      this.playerOpen.set(true);
    }
  }

  closePlayer(): void {
    this.playerOpen.set(false);
  }
}