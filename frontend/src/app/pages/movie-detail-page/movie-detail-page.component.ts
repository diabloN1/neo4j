import { CommonModule } from "@angular/common";
import { Component, OnInit, inject, signal, computed } from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { EMPTY, catchError, finalize, map, switchMap, tap } from "rxjs";

import { Movie } from "../../models/movie.model";
import { MovieService } from "../../services/movie.service";
import { ZardBadgeComponent } from "@/shared/components/badge/badge.component";
import { ZardButtonComponent } from "@/shared/components/button/button.component";
import { ZardCardImports } from "@/shared/components/card/card.imports";
import { StarRatingComponent } from "@/shared/components/star-rating/star-rating.component";

type PlayerProvider = "vidy" | "vidrift";

@Component({
  selector: "app-movie-detail-page",
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ZardBadgeComponent,
    ZardButtonComponent,
    ZardCardImports,
    StarRatingComponent,
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
  readonly providerChooserOpen = signal(false);
  readonly selectedProvider = signal<PlayerProvider>("vidy");

  readonly playerUrl = computed<SafeResourceUrl | null>(() => {
    const tmdbId = this.movie()?.tmdbId?.trim();

    if (!tmdbId) {
      return null;
    }

    const encodedId = encodeURIComponent(tmdbId);

    const url =
      this.selectedProvider() === "vidy"
        ? `https://vidy.st/movie/${encodedId}?color=DC2626&autoplay=true`
        : `https://embed.vidrift.net/embed/movie/${encodedId}`;

    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map((params) => params.get("id")),
        tap(() => {
          this.loading.set(true);
          this.error.set("");
          this.movie.set(null);
          this.playerOpen.set(false);
          this.providerChooserOpen.set(false);
          this.posterFailed.set(false);
        }),
        switchMap((id) => {
          if (!id) {
            this.error.set("No movie id was provided.");
            this.loading.set(false);
            return EMPTY;
          }

          return this.movieService.getMovieById(id).pipe(
            catchError((error) => {
              this.error.set(
                error.status === 404
                  ? "We could not find that movie."
                  : error.status === 0
                    ? "Cannot reach the Movie API at http://localhost:8081. Check the backend and its CORS configuration."
                    : `Could not load movie details${
                        error.status ? ` (${error.status})` : ""
                      }.`,
              );

              return EMPTY;
            }),
            finalize(() => this.loading.set(false)),
          );
        }),
      )
      .subscribe({
        next: (movie) => this.movie.set(movie),
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
    if (this.movie()?.tmdbId?.trim()) {
      this.providerChooserOpen.set(true);
    }
  }

  selectProvider(provider: PlayerProvider): void {
    this.selectedProvider.set(provider);
    this.providerChooserOpen.set(false);
    this.playerOpen.set(true);
  }

  changeProvider(): void {
    this.playerOpen.set(false);
    this.providerChooserOpen.set(true);
  }

  closeProviderChooser(): void {
    this.providerChooserOpen.set(false);
  }

  closePlayer(): void {
    this.playerOpen.set(false);
  }
}
