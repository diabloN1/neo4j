import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from "@angular/core";
import { HttpErrorResponse } from "@angular/common/http";
import { EMPTY, catchError, finalize } from "rxjs";

import { ZardButtonComponent } from "../button";
import { RatingService } from "@/services/rating.service";

@Component({
  selector: "app-star-rating",
  standalone: true,
  imports: [ZardButtonComponent],
  templateUrl: "./star-rating.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StarRatingComponent {
  private readonly ratingService = inject(RatingService);

  readonly movieId = input.required<string>();
  readonly valueChange = output<number>();

  readonly stars = [1, 2, 3, 4, 5];
  readonly label = signal("Rate this movie");

  readonly value = signal(0);
  readonly hoveredRating = signal<number | null>(null);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal("");

  readonly averageRating = signal<number | null>(null);
  readonly ratingCount = signal(0);
  readonly averageLoading = signal(false);
  readonly averageError = signal(false);

  readonly displayRating = computed(
    () => this.hoveredRating() ?? this.value(),
  );

  constructor() {
    effect(() => {
      const movieId = this.movieId();

      if (!movieId) {
        this.error.set("A movie ID is required to load your rating.");
        return;
      }

      this.loadMyRating(movieId);
      this.loadMovieAverage(movieId);
    });
  }

  private loadMyRating(movieId: string): void {
    this.loading.set(true);
    this.error.set("");

    this.ratingService
      .getMyRating(movieId)
      .pipe(
        catchError((error: unknown) => {
          if (error instanceof HttpErrorResponse && error.status === 404) {
            this.value.set(0);
            return EMPTY;
          }

          this.error.set("Could not load your rating.");
          return EMPTY;
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe((response) => {
        this.value.set(response.rating);
        this.valueChange.emit(response.rating);
      });
  }

  private loadMovieAverage(movieId: string): void {
    this.averageLoading.set(true);
    this.averageError.set(false);

    this.ratingService
      .getMovieRatingAverage(movieId)
      .pipe(
        catchError(() => {
          this.averageError.set(true);
          this.averageRating.set(null);
          this.ratingCount.set(0);
          return EMPTY;
        }),
        finalize(() => this.averageLoading.set(false)),
      )
      .subscribe((response) => {
        this.averageRating.set(response.averageRating);
        this.ratingCount.set(response.ratingCount);
      });
  }

  starIcon(star: number): string {
    const rating = this.displayRating();

    if (rating >= star) {
      return "star";
    }

    if (rating >= star - 0.5) {
      return "star_half";
    }

    return "star_border";
  }

  setRating(rating: number): void {
    if (
      this.loading() ||
      this.saving() ||
      !this.movieId() ||
      rating < 1 ||
      rating > 5
    ) {
      return;
    }

    const previousRating = this.value();

    this.value.set(rating);
    this.hoveredRating.set(null);
    this.saving.set(true);
    this.error.set("");

    this.ratingService.rateMovie(this.movieId(), rating)
      .pipe(
        catchError(() => {
          this.value.set(previousRating);
          this.error.set("Could not save your rating. Please try again.");
          return EMPTY;
        }),
        finalize(() => this.saving.set(false)),
      )
      .subscribe((response) => {
        this.value.set(response.rating);
        this.valueChange.emit(response.rating);
        this.loadMovieAverage(this.movieId());
      });
  }

  clearRating(): void {
    if (
      this.loading() ||
      this.saving() ||
      !this.movieId() ||
      this.value() <= 0
    ) {
      return;
    }

    const previousRating = this.value();

    this.value.set(0);
    this.hoveredRating.set(null);
    this.saving.set(true);
    this.error.set("");

    this.ratingService
      .deleteRating(this.movieId())
      .pipe(
        catchError(() => {
          this.value.set(previousRating);
          this.error.set("Could not clear your rating. Please try again.");
          return EMPTY;
        }),
        finalize(() => this.saving.set(false)),
      )
      .subscribe(() => {
        this.valueChange.emit(0);
        this.loadMovieAverage(this.movieId());
      });
  }

  resetHover(): void {
    this.hoveredRating.set(null);
  }
}