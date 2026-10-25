import { CommonModule } from "@angular/common";
import { Component, DestroyRef, OnInit, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { Subject, catchError, debounceTime, finalize, of } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

import { Movie, MovieQuery } from "../../models/movie.model";
import { MovieService } from "../../services/movie.service";

import { ZardBadgeComponent } from "@/shared/components/badge/badge.component";
import { ZardButtonComponent } from "@/shared/components/button/button.component";
import { ZardCardImports } from "@/shared/components/card/card.imports";
import { ZardInputComponent } from "@/shared/components/input/input.component";

@Component({
  selector: "app-catalog-page",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ZardBadgeComponent,
    ZardButtonComponent,
    ZardCardImports,
    ZardInputComponent,
  ],
  templateUrl: "catalog-page.component.html",
})
export class CatalogPageComponent implements OnInit {
  private readonly movieService = inject(MovieService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly filterChanges = new Subject<void>();

  readonly movies = signal<Movie[]>([]);
  readonly genres = signal<string[]>([]);
  readonly loading = signal(false);
  readonly error = signal("");
  readonly totalPages = signal(1);
  readonly totalElements = signal(0);
  readonly page = signal(0);
  readonly brokenPosters = signal(new Set<string>());

  readonly size = 20;
  readonly currentYear = new Date().getFullYear();

  search = "";
  genre = "";
  year: number | null = null;

  ngOnInit(): void {
    this.movieService
      .getGenres()
      .pipe(
        catchError(() => of([])),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((items) => this.genres.set(items ?? []));

    this.filterChanges
      .pipe(
        debounceTime(300),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.page.set(0);
        this.loadMovies();
      });

    this.loadMovies();
  }

  onFilterInput(): void {
    this.filterChanges.next();
  }

  applyFilters(): void {
    this.page.set(0);
    this.loadMovies();
  }

  clearFilters(): void {
    this.search = "";
    this.genre = "";
    this.year = null;
    this.applyFilters();
  }

  go(nextPage: number): void {
    if (nextPage < 0 || nextPage >= this.totalPages()) {
      return;
    }

    this.page.set(nextPage);
    this.loadMovies();

    document.getElementById("catalog")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  markPosterBroken(title: string): void {
    this.brokenPosters.update((current) => new Set(current).add(title));
  }

  loadMovies(): void {
    this.loading.set(true);
    this.error.set("");

    const query: MovieQuery = {
      search: this.search.trim(),
      genre: this.genre,
      year: this.year,
      page: this.page(),
      size: this.size,
    };

    this.movieService
      .getMovies(query)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => {
          const list =
            response.content ?? response.movies ?? response.items ?? [];

          this.movies.set(list);
          this.totalPages.set(Math.max(1, response.totalPages ?? 1));
          this.totalElements.set(response.totalElements ?? list.length);
        },
        error: (error) => {
          this.error.set(
            error.status === 0
              ? "Cannot reach the Movie API at http://localhost:8081. Check that the backend is running and allows requests from http://localhost:4200 (CORS)."
              : `Movie API returned an error${error.status ? ` (${error.status})` : ""}. Check the backend logs.`,
          );
        },
      });
  }
}