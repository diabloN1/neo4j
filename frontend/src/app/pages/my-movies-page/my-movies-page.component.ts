import { CommonModule } from "@angular/common";
import { Component, HostListener, OnInit, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { EMPTY, catchError, finalize, of, tap } from "rxjs";

import { Movie, MovieQuery, MovieWriteRequest } from "../../models/movie.model";
import { AuthService } from "../../services/auth.service";
import { MovieService } from "../../services/movie.service";
import { ConfirmDialogService } from "@/services/confirm-dialog.service";

interface MovieForm {
  title: string;
  year: number | null;
  released: string;
  plot: string;
  budget: number | null;
  revenue: number | null;
  runtime: number | null;
  countries: string;
  languages: string;
  poster: string;
  genres: string[];
  actors: string[];
  directors: string[];
}

const emptyForm = (): MovieForm => ({
  title: "",
  year: null,
  released: "",
  plot: "",
  budget: null,
  revenue: null,
  runtime: null,
  countries: "",
  languages: "",
  poster: "",
  genres: [],
  actors: [],
  directors: [],
});

@Component({
  selector: "app-my-movies-page",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: "./my-movies-page.component.html",
})
export class MyMoviesPageComponent implements OnInit {
  private readonly movieService = inject(MovieService);
  readonly authService = inject(AuthService);

  readonly movies = signal<Movie[]>([]);
  readonly genres = signal<string[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly deletingId = signal<string | null>(null);
  readonly error = signal("");
  readonly success = signal("");
  readonly editingId = signal<string | null>(null);
  readonly isFormOpen = signal(false);
  private readonly confirmDialog = inject(ConfirmDialogService);

  readonly currentPage = signal(0);
  readonly pageSize = signal(3);
  readonly totalPages = signal(0);
  readonly totalElements = signal(0);

  form: MovieForm = emptyForm();
  actorInput = "";
  directorInput = "";

  @HostListener("document:keydown.escape")
  onEscapeKey(): void {
    if (this.isFormOpen() && !this.saving()) {
      this.closeModal();
    }
  }

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.error.set("Log in to create and manage your movies.");
      return;
    }

    this.movieService
      .getGenres()
      .pipe(catchError(() => of([] as string[])))
      .subscribe((items) => {
        this.genres.set(
          (items ?? []).filter(
            (item) => !!item && item !== "(no genres listed)",
          ),
        );
      });

    this.loadOwnedMovies();
  }

  private loadOwnedMovies(): void {
    this.loading.set(true);

    const query: MovieQuery = {
      page: this.currentPage(),
      size: this.pageSize(),
    };

    this.movieService
      .getMyMovies(query)
      .pipe(
        finalize(() => this.loading.set(false)),
        catchError((err) => {
          this.error.set(this.errorMessage(err, "Failed to load your movies."));
          return of(null);
        }),
      )
      .subscribe((response) => {
        if (!response) return;

        this.movies.set(response.content);
        this.totalPages.set(response.totalPages);
        this.totalElements.set(response.totalElements);
      });
  }

  goToPage(page: number): void {
    if (
      page < 0 ||
      page >= this.totalPages() ||
      page === this.currentPage() ||
      this.loading()
    ) {
      return;
    }

    this.currentPage.set(page);
    this.loadOwnedMovies();
  }

  previousPage(): void {
    this.goToPage(this.currentPage() - 1);
  }

  nextPage(): void {
    this.goToPage(this.currentPage() + 1);
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form = emptyForm();
    this.actorInput = "";
    this.directorInput = "";
    this.error.set("");
    this.isFormOpen.set(true);
    document.body.style.overflow = "hidden"; // Prevent background scroll
  }

  openEdit(movie: Movie): void {
    this.editingId.set(movie.movieId);
    this.form = {
      title: movie.title ?? "",
      year: movie.year ?? null,
      released: movie.released ?? "",
      plot: movie.plot ?? "",
      budget: movie.budget ?? null,
      revenue: movie.revenue ?? null,
      runtime: movie.runtime ?? null,
      countries: (movie.countries ?? []).join(", "),
      languages: (movie.languages ?? []).join(", "),
      poster: movie.poster ?? "",
      genres: [...(movie.genreNames ?? [])],
      actors: [...(movie.actorNames ?? [])],
      directors: [...(movie.directorNames ?? [])],
    };
    this.error.set("");
    this.isFormOpen.set(true);
    document.body.style.overflow = "hidden";
  }

  closeModal(): void {
    this.isFormOpen.set(false);
    this.editingId.set(null);
    this.form = emptyForm();
    this.actorInput = "";
    this.directorInput = "";
    document.body.style.overflow = ""; // Re-enable background scroll
  }

  submit(): void {
    this.error.set("");
    this.success.set("");

    if (!this.authService.isAuthenticated()) {
      this.error.set("Your session has expired. Log in again.");
      return;
    }

    if (!this.form.title.trim()) {
      this.error.set("Movie title is required.");
      return;
    }

    if (this.actorInput.trim()) this.addActor();
    if (this.directorInput.trim()) this.addDirector();

    const request = this.toRequest();
    const id = this.editingId();

    this.saving.set(true);

    const operation = id
      ? this.movieService.updateOwnedMovie(id, request)
      : this.movieService.createOwnedMovie(request);

    operation
      .pipe(
        tap(() => {
          this.success.set(
            id ? "Movie updated successfully." : "Movie created successfully.",
          );

          this.closeModal();
          this.loadOwnedMovies();
        }),
        catchError((error) => {
          this.error.set(
            this.errorMessage(
              error,
              id ? "Could not update movie." : "Could not create movie.",
            ),
          );
          return EMPTY;
        }),
        finalize(() => this.saving.set(false)),
      )
      .subscribe();
  }

  async deleteMovie(movie: Movie): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: `Delete "${movie.title}"?`,
      description:
        "This action cannot be undone. This movie and its links will be permanently deleted from your library.",
      confirmText: "Delete movie",
      variant: "destructive",
    });

    if (!confirmed) return;

    this.error.set("");
    this.success.set("");
    this.deletingId.set(movie.movieId);

    this.movieService
      .deleteOwnedMovie(movie.movieId)
      .pipe(
        tap(() => {
          this.success.set("Movie deleted successfully.");

          if (this.movies().length === 1 && this.currentPage() > 0) {
            this.currentPage.update((page) => page - 1);
          }

          this.loadOwnedMovies();
        }),
        catchError((error) => {
          this.error.set(
            this.errorMessage(
              error,
              "Could not delete movie. Only its owner can delete it.",
            ),
          );
          return EMPTY;
        }),
        finalize(() => this.deletingId.set(null)),
      )
      .subscribe();
  }

  private toRequest(): MovieWriteRequest {
    return {
      title: this.form.title.trim(),
      year: this.form.year ? Number(this.form.year) : null,
      released: this.form.released.trim() || null,
      plot: this.form.plot.trim() || null,
      budget: this.form.budget ? Number(this.form.budget) : null,
      revenue: this.form.revenue ? Number(this.form.revenue) : null,
      runtime: this.form.runtime ? Number(this.form.runtime) : null,
      countries: this.splitNames(this.form.countries),
      languages: this.splitNames(this.form.languages),
      poster: this.form.poster.trim() || null,
      genres: [...new Set(this.form.genres)],
      actors: [
        ...new Set(this.form.actors.map((n) => n.trim()).filter(Boolean)),
      ],
      directors: [
        ...new Set(this.form.directors.map((n) => n.trim()).filter(Boolean)),
      ],
    };
  }

  private splitNames(value: string): string[] {
    return [
      ...new Set(
        value
          .split(",")
          .map((i) => i.trim())
          .filter(Boolean),
      ),
    ];
  }

  toggleGenre(genre: string, checked: boolean): void {
    this.form.genres = checked
      ? [...new Set([...this.form.genres, genre])]
      : this.form.genres.filter((g) => g !== genre);
  }

  addActor(): void {
    const name = this.actorInput.trim();
    if (
      name &&
      !this.form.actors.some((a) => a.toLowerCase() === name.toLowerCase())
    ) {
      this.form.actors = [...this.form.actors, name];
    }
    this.actorInput = "";
  }

  removeActor(name: string): void {
    this.form.actors = this.form.actors.filter((a) => a !== name);
  }

  addDirector(): void {
    const name = this.directorInput.trim();
    if (
      name &&
      !this.form.directors.some((d) => d.toLowerCase() === name.toLowerCase())
    ) {
      this.form.directors = [...this.form.directors, name];
    }
    this.directorInput = "";
  }

  removeDirector(name: string): void {
    this.form.directors = this.form.directors.filter((d) => d !== name);
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = "none";
  }

  private errorMessage(error: any, fallback: string): string {
    if (error?.status === 0) return "Cannot reach the Movie API. Check server.";
    return error?.error?.detail || error?.error?.message || fallback;
  }
}
