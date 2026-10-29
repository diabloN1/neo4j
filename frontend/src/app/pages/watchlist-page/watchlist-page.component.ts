import { CommonModule } from "@angular/common";
import { Component, OnInit, inject, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { EMPTY, catchError, finalize } from "rxjs";

import { Movie } from "../../models/movie.model";
import { WatchlistService } from "../../services/watchlist.service";
import { ZardButtonComponent } from "@/shared/components/button/button.component";

@Component({
  selector: "app-watchlist-page",
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ZardButtonComponent,
  ],
  templateUrl: "./watchlist-page.component.html",
})
export class WatchlistPageComponent implements OnInit {
  private readonly watchlistService = inject(WatchlistService);

  readonly movies = signal<Movie[]>([]);
  readonly loading = signal(true);
  readonly error = signal("");
  readonly removingMovieIds = signal(new Set<string>());
  readonly posterFailures = signal(new Set<string>());
  readonly removeErrors = signal<Record<string, string>>({});
movie: any;

  ngOnInit(): void {
    this.loadWatchlist();
  }

  loadWatchlist(): void {
    this.loading.set(true);
    this.error.set("");

    this.watchlistService
      .findMoviesByUser()
      .pipe(
        catchError((error) => {
          this.error.set(
            error.status === 0
              ? "Cannot connect to Neo4flix. Please check your connection."
              : `Could not load your watchlist${
                  error.status ? ` (${error.status})` : ""
                }.`,
          );

          return EMPTY;
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe((movies) => this.movies.set(movies));
  }

  removeMovie(movie: Movie): void {
    const movieId = movie.movieId;

    if (
      !movieId ||
      this.removingMovieIds().has(movieId)
    ) {
      return;
    }

    this.removingMovieIds.update((ids) => new Set(ids).add(movieId));

    this.removeErrors.update((errors) => {
      const updated = { ...errors };
      delete updated[movieId];
      return updated;
    });

    this.watchlistService
      .removeWatchlist(movieId)
      .pipe(
        catchError((error) => {
          this.removeErrors.update((errors) => ({
            ...errors,
            [movieId]:
              error.status === 0
                ? "Connection failed. Please try again."
                : "Could not remove this movie. Please try again.",
          }));

          return EMPTY;
        }),
        finalize(() => {
          this.removingMovieIds.update((ids) => {
            const updated = new Set(ids);
            updated.delete(movieId);
            return updated;
          });
        }),
      )
      .subscribe(() => {
        this.movies.update((movies) =>
          movies.filter((item) => item.movieId !== movieId),
        );
      });
  }

  markPosterFailed(movieId: string): void {
    this.posterFailures.update((ids) => new Set(ids).add(movieId));
  }

  hasPosterFailed(movieId: string): boolean {
    return this.posterFailures().has(movieId);
  }
}