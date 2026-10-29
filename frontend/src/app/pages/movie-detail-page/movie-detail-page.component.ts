import { CommonModule } from "@angular/common";
import { Component, OnInit, inject, signal, computed } from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { EMPTY, catchError, finalize, map, of, switchMap, tap } from "rxjs";

import { Movie } from "../../models/movie.model";
import { MovieService } from "../../services/movie.service";
import { WatchlistService } from "../../services/watchlist.service";
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
  private readonly watchlistService = inject(WatchlistService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly movie = signal<Movie | null>(null);
  readonly loading = signal(true);
  readonly error = signal("");
  readonly posterFailed = signal(false);

  readonly inWatchlist = signal(false);
  readonly watchlistReady = signal(false);
  readonly watchlistLoading = signal(false);
  readonly watchlistError = signal("");

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
          this.posterFailed.set(false);
          this.playerOpen.set(false);
          this.providerChooserOpen.set(false);
          this.inWatchlist.set(false);
          this.watchlistReady.set(false);
          this.watchlistLoading.set(false);
          this.watchlistError.set("");
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
            switchMap((movie) =>
              this.watchlistService.inWatchList(movie.movieId).pipe(
                map((inWatchlist) => ({
                  movie,
                  inWatchlist,
                  watchlistError: "",
                })),
                catchError(() =>
                  of({
                    movie,
                    inWatchlist: false,
                    watchlistError: "Could not check your watchlist.",
                  }),
                ),
              ),
            ),
            finalize(() => this.loading.set(false)),
          );
        }),
      )
      .subscribe({
        next: ({ movie, inWatchlist, watchlistError }) => {
          this.movie.set(movie);
          this.inWatchlist.set(inWatchlist);
          this.watchlistError.set(watchlistError);
          this.watchlistReady.set(!watchlistError);
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

  toggleWatchlist(): void {
    const movieId = this.movie()?.movieId;

    if (!movieId || this.watchlistLoading() || !this.watchlistReady()) {
      return;
    }

    const wasInWatchlist = this.inWatchlist();

    this.watchlistLoading.set(true);
    this.watchlistError.set("");

    const request = wasInWatchlist
      ? this.watchlistService.removeWatchlist(movieId)
      : this.watchlistService.addWatchlist(movieId);

    request
      .pipe(
        tap(() => this.inWatchlist.set(!wasInWatchlist)),
        catchError((error) => {
          this.watchlistError.set(
            error.status === 0
              ? "Cannot reach the Watchlist API. Please try again."
              : `Could not ${wasInWatchlist ? "remove the movie from" : "add the movie to"} your watchlist${
                  error.status ? ` (${error.status})` : ""
                }.`,
          );

          return EMPTY;
        }),
        finalize(() => this.watchlistLoading.set(false)),
      )
      .subscribe();
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