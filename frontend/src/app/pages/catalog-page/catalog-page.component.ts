import { CommonModule } from "@angular/common";
import {
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import {
  catchError,
  finalize,
  of,
} from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

import { Movie, MovieQuery } from "../../models/movie.model";
import { MovieService } from "../../services/movie.service";

import { ObserveVisibleDirective } from "@/shared/directives/observe-visible.directive";
import { ZardBadgeComponent } from "@/shared/components/badge/badge.component";
import { ZardButtonComponent } from "@/shared/components/button/button.component";
import { ZardCardImports } from "@/shared/components/card/card.imports";

@Component({
  selector: "app-catalog-page",
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ObserveVisibleDirective,
    ZardBadgeComponent,
    ZardButtonComponent,
    ZardCardImports,
  ],
  templateUrl: "./catalog-page.component.html",
})
export class CatalogPageComponent implements OnInit {
  private readonly movieService = inject(MovieService);
  private readonly destroyRef = inject(DestroyRef);

  /** First page of movies, used for the featured hero and empty state. */
  readonly movies = signal<Movie[]>([]);

  readonly genres = signal<string[]>([]);

  /** Movies loaded for each individual genre. */
  readonly genreMovies = signal<Record<string, Movie[]>>({});

  /** Current zero-based page loaded for each genre. */
  readonly genrePages = signal<Record<string, number>>({});

  /** Whether additional pages exist for each genre. */
  readonly genreHasMore = signal<Record<string, boolean>>({});

  /** Loading state for each genre, independent of other rows. */
  readonly genreLoadingByGenre = signal<Record<string, boolean>>({});

  readonly loading = signal(false);
  readonly error = signal("");
  readonly brokenPosters = signal(new Set<string>());

  /** Page size for genre-specific infinite scrolling. */
  readonly size = 20;

  ngOnInit(): void {
    this.loadGenres();
    this.loadMovies();
  }

  /**
   * Load genres, then load the first page of movies for each genre.
   */
  private loadGenres(): void {
    this.movieService
      .getGenres()
      .pipe(
        catchError((error) => {
          console.error("Failed to load genres", error);
          return of([] as string[]);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((items) => {
        const categories = (items ?? []).filter(
          (item) => item && item !== "(no genres listed)",
        );

        this.genres.set(categories);

        for (const category of categories) {
          this.loadGenrePage(category, 0);
        }
      });
  }

  /**
   * Load one page for one genre.
   *
   * Page zero replaces the genre's current list.
   * Later pages append unique movies to that list.
   */
  private loadGenrePage(genre: string, page: number): void {
    if (this.isGenreLoading(genre)) {
      return;
    }

    if (page > 0 && !this.hasMoreGenreMovies(genre)) {
      return;
    }

    this.setGenreLoading(genre, true);

    const query: MovieQuery = {
      search: "",
      genre,
      year: null,
      page,
      size: this.size,
    };

    this.movieService
      .getMovies(query)
      .pipe(
        catchError((error) => {
          console.error(`Failed to load ${genre} movies`, error);
          return of(null);
        }),
        finalize(() => this.setGenreLoading(genre, false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((response) => {
        if (!response) {
          return;
        }

        const received: Movie[] =
          response.content ??
          response.movies ??
          response.items ??
          [];

        this.genreMovies.update((current) => {
          const existing = page === 0 ? [] : current[genre] ?? [];

          const seen = new Set(
            existing.map((movie) => movie.tmdbId ?? movie.title),
          );

          const uniqueReceived = received.filter((movie) => {
            const key = movie.tmdbId ?? movie.title;

            if (seen.has(key)) {
              return false;
            }

            seen.add(key);
            return true;
          });

          return {
            ...current,
            [genre]: [...existing, ...uniqueReceived],
          };
        });

        this.genrePages.update((current) => ({
          ...current,
          [genre]: page,
        }));

        const hasMore =
          response.totalPages != null
            ? page + 1 < response.totalPages
            : received.length >= this.size;

        this.genreHasMore.update((current) => ({
          ...current,
          [genre]: hasMore,
        }));
      });
  }

  /**
   * Called when a movie near the end of a genre row becomes visible.
   */
  loadMoreGenreMovies(genre: string): void {
    if (this.isGenreLoading(genre) || !this.hasMoreGenreMovies(genre)) {
      return;
    }

    const nextPage = (this.genrePages()[genre] ?? 0) + 1;
    this.loadGenrePage(genre, nextPage);
  }

  private setGenreLoading(genre: string, loading: boolean): void {
    this.genreLoadingByGenre.update((current) => ({
      ...current,
      [genre]: loading,
    }));
  }

  moviesForGenre(genre: string): Movie[] {
    return this.genreMovies()[genre] ?? [];
  }

  hasMoreGenreMovies(genre: string): boolean {
    return this.genreHasMore()[genre] ?? false;
  }

  isGenreLoading(genre: string): boolean {
    return this.genreLoadingByGenre()[genre] ?? false;
  }

  /**
   * Load the initial movie list used by the featured hero.
   * Search and pagination are handled by the browse page.
   */
  loadMovies(): void {
    this.loading.set(true);
    this.error.set("");

    const query: MovieQuery = {
      search: "",
      genre: "",
      year: null,
      page: 0,
      size: this.size,
    };

    this.movieService
      .getMovies(query)
      .pipe(
        catchError((error) => {
          this.error.set(
            error.status === 0
              ? "Cannot reach the Movie API. Check that the backend is running and CORS is configured."
              : `Movie API returned an error${
                  error.status ? ` (${error.status})` : ""
                }. Check the backend logs.`,
          );

          return of(null);
        }),
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((response) => {
        if (!response) {
          return;
        }

        const list: Movie[] =
          response.content ??
          response.movies ??
          response.items ??
          [];

        this.movies.set(list);
      });
  }

  markPosterBroken(title: string): void {
    this.brokenPosters.update((current) => {
      const updated = new Set(current);
      updated.add(title);
      return updated;
    });
  }
}