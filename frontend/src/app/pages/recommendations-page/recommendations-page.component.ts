import { CommonModule } from "@angular/common";
import { Component, DestroyRef, OnInit, inject, signal } from "@angular/core";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { catchError, finalize, of } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

import { MovieQuery } from "../../models/movie.model";
import { MovieService } from "../../services/movie.service";
import { RecommandationService } from "../../services/recommandation.service";

import { ZardButtonComponent } from "@/shared/components/button/button.component";
import { MovieRecommendation } from "@/models/recommendation";

import { ObserveVisibleDirective } from "@/shared/directives/observe-visible.directive";

@Component({
  selector: "app-recommendations-page",
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ObserveVisibleDirective,
    ZardButtonComponent,
  ],
  templateUrl: "./recommendations-page.component.html",
})
export class RecommendationsPageComponent implements OnInit {
  private readonly recommendationService = inject(RecommandationService);
  private readonly movieService = inject(MovieService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly recommendations = signal<MovieRecommendation[]>([]);
  readonly genres = signal<string[]>([]);

  readonly selectedGenre = signal("");
  readonly selectedYear = signal<number | null>(null);

  readonly loading = signal(false);
  readonly loadingMore = signal(false);
  readonly error = signal("");
  readonly hasMore = signal(true);

  readonly brokenPosters = signal(new Set<string>());

  readonly size = 20;
  private page = 0;

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const genre = params.get("genre") ?? "";
      const yearParam = params.get("year");
      const year = yearParam ? Number(yearParam) : null;

      this.selectedGenre.set(genre);
      this.selectedYear.set(
        year !== null && Number.isInteger(year) ? year : null,
      );

      this.loadRecommendations(true);
    });

    this.loadGenres();
  }
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
        this.genres.set(
          (items ?? []).filter(
            (genre) => genre && genre !== "(no genres listed)",
          ),
        );
      });
  }

  loadRecommendations(reset = true): void {
    if (this.loading() || this.loadingMore()) {
      return;
    }

    if (reset) {
      this.page = 0;
      this.hasMore.set(true);
      this.recommendations.set([]);
      this.error.set("");
      this.loading.set(true);
    } else {
      if (!this.hasMore()) {
        return;
      }

      this.loadingMore.set(true);
    }

    const query: MovieQuery = {
      search: "",
      genre: this.selectedGenre(),
      year: this.selectedYear(),
      page: this.page,
      size: this.size,
    };

    this.recommendationService
      .getRecommandations(query)
      .pipe(
        catchError((error) => {
          console.error("Failed to load recommendations", error);

          this.error.set(
            error.status === 0
              ? "Cannot reach the Recommendation API. Check that the backend is running."
              : `Unable to load recommendations${
                  error.status ? ` (${error.status})` : ""
                }. Please try again.`,
          );

          return of(null);
        }),
        finalize(() => {
          this.loading.set(false);
          this.loadingMore.set(false);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((response) => {
        if (response === null) {
          return;
        }

        this.recommendations.update((current) => {
          const existing = reset ? [] : current;
          const seen = new Set(existing.map((movie) => movie.movieId));

          const uniqueMovies = response.filter((movie) => {
            if (seen.has(movie.movieId)) {
              return false;
            }

            seen.add(movie.movieId);
            return true;
          });

          return [...existing, ...uniqueMovies];
        });

        this.hasMore.set(response.length === this.size);
        this.page++;
      });
  }

  onGenreChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedGenre.set(value);
    this.updateUrlFilters();
    this.loadRecommendations();
  }

  onYearChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;

    this.selectedYear.set(value === "" ? null : Number(value));
    this.updateUrlFilters();
    this.loadRecommendations();
  }

  clearFilters(): void {
    this.selectedGenre.set("");
    this.selectedYear.set(null);
    this.updateUrlFilters();
    this.loadRecommendations();
  }

  markPosterBroken(movieId: string): void {
    this.brokenPosters.update((current) => {
      const updated = new Set(current);
      updated.add(movieId);
      return updated;
    });
  }

  retry(): void {
    this.loadRecommendations();
  }

  private updateUrlFilters(): void {
    const genre = this.selectedGenre();
    const year = this.selectedYear();

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        genre: genre || null,
        year: year ?? null,
      },
      queryParamsHandling: "merge",
      replaceUrl: true,
    });
  }
}
