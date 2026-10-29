import { CommonModule } from "@angular/common";
import {
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  signal,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { interval } from "rxjs";

import { ZardButtonComponent } from "@/shared/components/button/button.component";

export interface FeaturedMovie {
  movieId: string | number;
  title: string;
  poster?: string | null;
  year?: number | string | null;
  imdbRating?: number | null;
  runtime?: number | null;
  plot?: string | null;
  genreNames?: string[] | null;
}

@Component({
  selector: "app-movies-slider",
  standalone: true,
  imports: [CommonModule, RouterLink, ZardButtonComponent],
  templateUrl: "./movies-slider.component.html",
})
export class MoviesSliderComponent {
  private readonly destroyRef = inject(DestroyRef);

  readonly movies = input<FeaturedMovie[]>([]);
  readonly text = input("Featured movies");
  readonly autoplay = input(true);
  readonly intervalMs = input(10000);

  readonly currentSlide = signal(0);
  readonly brokenPosters = signal(new Set<string>());

  readonly featuredMovies = computed(() => this.movies().slice(0, 4));

  readonly activeMovie = computed(
    () => this.featuredMovies()[this.currentSlide()] ?? null,
  );

  constructor() {
    interval(this.intervalMs())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.autoplay()) {
          this.nextSlide();
        }
      });
  }

  nextSlide(): void {
    const count = this.featuredMovies().length;

    if (count > 1) {
      this.currentSlide.update((index) => (index + 1) % count);
    }
  }

  previousSlide(): void {
    const count = this.featuredMovies().length;

    if (count > 1) {
      this.currentSlide.update((index) => (index - 1 + count) % count);
    }
  }

  goToSlide(index: number): void {
    if (index >= 0 && index < this.featuredMovies().length) {
      this.currentSlide.set(index);
    }
  }

  posterIsBroken(movie: FeaturedMovie): boolean {
    return this.brokenPosters().has(String(movie.movieId));
  }

  markPosterBroken(movie: FeaturedMovie): void {
    this.brokenPosters.update((current) => {
      const updated = new Set(current);
      updated.add(String(movie.movieId));
      return updated;
    });
  }
}
