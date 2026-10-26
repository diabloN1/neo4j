import { CommonModule } from "@angular/common";
import {
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, RouterLink } from "@angular/router";
import {
  Subject,
  catchError,
  debounceTime,
  finalize,
  of,
  switchMap,
  tap,
} from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

import { Movie, MovieQuery } from "../../models/movie.model";
import { MovieService } from "../../services/movie.service";
import { ObserveVisibleDirective } from "@/shared/directives/observe-visible.directive";

@Component({
  selector: "app-movie-browser",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ObserveVisibleDirective,
  ],
  templateUrl: "search-page.component.html",
})
export class SearchComponent implements OnInit {
  private readonly movieService = inject(MovieService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly filterChanges = new Subject<void>();

  readonly movies = signal<Movie[]>([]);
  readonly genres = signal<string[]>([]);
  readonly loading = signal(false);
  readonly error = signal("");
  readonly hasMore = signal(true);
  readonly totalElements = signal(0);
  readonly brokenPosters = signal(new Set<string>());

  readonly size = 20;
  readonly currentYear = new Date().getFullYear();

  search = "";
  genre = "";
  year: number | null = null;

  private page = 0;
  private requestId = 0;

  ngOnInit(): void {
    // Load available genres.
    this.movieService
      .getGenres()
      .pipe(
        catchError(() => of([] as string[])),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((items) => {
        this.genres.set(
          (items ?? []).filter(
            (item) => item && item !== "(no genres listed)",
          ),
        );
      });

    // Debounce filter changes and cancel any previous filter request.
    this.filterChanges
      .pipe(
        debounceTime(300),
        tap(() => this.resetResults()),
        switchMap(() => this.fetchPage(0)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();

    // Read search and genre from the URL.
    // Also supports year if supplied.
    let initialized = false;

    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const nextSearch = params.get("search") ?? "";
        const nextGenre = params.get("genre") ?? "";
        const yearParam = params.get("year");
        const parsedYear =
          yearParam && yearParam.trim() !== ""
            ? Number(yearParam)
            : null;
        const nextYear =
          parsedYear !== null && Number.isInteger(parsedYear)
            ? parsedYear
            : null;

        const changed =
          nextSearch !== this.search ||
          nextGenre !== this.genre ||
          nextYear !== this.year;

        this.search = nextSearch;
        this.genre = nextGenre;
        this.year = nextYear;

        if (!initialized) {
          initialized = true;
          this.loadFirstPage();
          return;
        }

        if (changed) {
          this.filterChanges.next();
        }
      });
  }

  onFilterChange(): void {
    this.filterChanges.next();
  }

  applyFilters(): void {
    this.filterChanges.next();
  }

  clearFilters(): void {
    this.search = "";
    this.genre = "";
    this.year = null;
    this.filterChanges.next();
  }

  loadFirstPage(): void {
    this.resetResults();

    this.fetchPage(0)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  loadMore(): void {
    if (this.loading() || !this.hasMore()) {
      return;
    }

    this.fetchPage(this.page + 1)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  retry(): void {
    this.error.set("");

    if (this.movies().length && this.hasMore()) {
      this.loadMore();
    } else {
      this.loadFirstPage();
    }
  }

  markPosterBroken(title: string): void {
    this.brokenPosters.update((current) => {
      const updated = new Set(current);
      updated.add(title);
      return updated;
    });
  }

  private resetResults(): void {
    // Invalidate previous requests so stale responses cannot update the list.
    this.requestId++;
    this.page = 0;
    this.movies.set([]);
    this.totalElements.set(0);
    this.hasMore.set(true);
    this.error.set("");
  }

  private fetchPage(page: number) {
    const requestId = this.requestId;

    this.loading.set(true);
    this.error.set("");

    const query: MovieQuery = {
      search: this.search.trim(),
      genre: this.genre,
      year: this.year,
      page,
      size: this.size,
    };

    return this.movieService.getMovies(query).pipe(
      catchError((error) => {
        if (requestId === this.requestId) {
          this.error.set(
            error.status === 0
              ? "Cannot reach the Movie API. Check that the backend is running."
              : `Movie API returned an error${
                  error.status ? ` (${error.status})` : ""
                }.`,
          );
        }

        return of(null);
      }),

      finalize(() => {
        if (requestId === this.requestId) {
          this.loading.set(false);
        }
      }),

      tap((response) => {
        if (!response || requestId !== this.requestId) {
          return;
        }

        const received: Movie[] =
          response.content ??
          response.movies ??
          response.items ??
          [];

        this.movies.update((current) => {
          const existingKeys = new Set(
            current.map((movie) => movie.tmdbId ?? movie.title),
          );

          return [
            ...current,
            ...received.filter((movie) => {
              const key = movie.tmdbId ?? movie.title;

              if (existingKeys.has(key)) {
                return false;
              }

              existingKeys.add(key);
              return true;
            }),
          ];
        });

        this.page = page;

        this.totalElements.set(
          response.totalElements ?? this.movies().length,
        );

        this.hasMore.set(
          response.totalPages != null
            ? page + 1 < response.totalPages
            : received.length >= this.size,
        );
      }),
    );
  }
}