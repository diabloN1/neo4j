import { CommonModule } from "@angular/common";
import {
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  HostListener,
  Output,
  ViewChild,
  inject,
  signal,
} from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import {
  Subject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  map,
  of,
  switchMap,
  tap,
} from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

import { Movie } from "../../../models/movie.model";
import { MovieService } from "../../../services/movie.service";

@Component({
  selector: "app-search",
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <!-- Search button -->
    <button
      type="button"
      (click)="openSearch()"
      class="ml-auto flex h-9 items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-zinc-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
      aria-label="Search movies"
      title="Search movies (Ctrl+K)"
    >
      <span class="material-icons text-xl" aria-hidden="true">search</span>

      <span class="hidden sm:inline">Search</span>

      <kbd
        class="hidden rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-zinc-500 sm:inline"
      >
        Ctrl K
      </kbd>
    </button>

    <!-- Search overlay -->
    <div
      *ngIf="searchOpen()"
      class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-contain bg-black/75 px-3 py-6 backdrop-blur-sm sm:items-center sm:px-6 sm:py-8"
      (click)="closeSearch()"
    >
      <section
        class="my-auto flex w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-white/10 bg-zinc-950 shadow-2xl shadow-black/60"
        [style.max-height]="'calc(100dvh - 3rem)'"
        role="dialog"
        aria-modal="true"
        aria-label="Search movies"
        (click)="$event.stopPropagation()"
      >
        <!-- Search input -->
        <form
          class="flex shrink-0 items-center gap-3 border-b border-white/10 px-4"
          (submit)="submitSearch($event)"
        >
          <span
            class="material-icons shrink-0 text-[22px] text-zinc-400"
            aria-hidden="true"
          >
            search
          </span>

          <input
            #searchInput
            type="search"
            [value]="searchTerm()"
            (input)="onSearchInput($event)"
            placeholder="Search movies by title..."
            aria-label="Search movies by title"
            class="h-14 min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-zinc-500"
          />

          <button
            type="submit"
            [disabled]="!searchTerm().trim()"
            class="shrink-0 rounded-md bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Search
          </button>

          <button
            type="button"
            (click)="closeSearch()"
            class="flex size-8 shrink-0 items-center justify-center rounded border border-white/10 text-zinc-400 transition hover:bg-white/10 hover:text-white"
            aria-label="Close search"
            title="Close search (Esc)"
          >
            <span class="material-icons text-lg" aria-hidden="true">
              close
            </span>
          </button>
        </form>

        <!-- Search results -->
        <div class="min-h-0 flex-1 overflow-y-auto p-2">
          <p
            *ngIf="!searchTerm().trim()"
            class="px-4 py-8 text-center text-sm text-zinc-500"
          >
            Start typing to search the movie collection.
          </p>

          <div
            *ngIf="searchLoading()"
            class="flex items-center justify-center gap-3 px-4 py-8 text-sm text-zinc-400"
            aria-live="polite"
          >
            <span
              class="size-5 animate-spin rounded-full border-2 border-zinc-700 border-t-rose-600"
            ></span>
            Searching...
          </div>

          <ng-container *ngIf="!searchLoading() && searchTerm().trim()">
            <a
              *ngFor="let movie of searchResults()"
              [routerLink]="['/movies', movie.title]"
              (click)="closeSearch()"
              class="flex items-center gap-4 rounded-lg p-3 transition hover:bg-white/10"
            >
              <img
                *ngIf="movie.poster"
                [src]="movie.poster"
                alt=""
                loading="lazy"
                class="h-16 w-11 shrink-0 rounded object-cover"
              />

              <div
                *ngIf="!movie.poster"
                class="flex h-16 w-11 shrink-0 items-center justify-center rounded bg-zinc-800 text-xs text-zinc-500"
              >
                N
              </div>

              <div class="min-w-0 flex-1">
                <h2 class="truncate text-sm font-semibold text-white">
                  {{ movie.title }}
                </h2>

                <p class="mt-1 text-xs text-zinc-400">
                  <span *ngIf="movie.year">{{ movie.year }}</span>

                  <span *ngIf="movie.year && movie.imdbRating != null">
                    ·
                  </span>

                  <span *ngIf="movie.imdbRating != null">
                    ★ {{ movie.imdbRating }}
                  </span>
                </p>

                <p
                  *ngIf="movie.genres?.length"
                  class="mt-1 truncate text-xs text-zinc-500"
                >
                  {{ movie.genres!.slice(0, 3).join(" · ") }}
                </p>
              </div>

              <span
                class="material-icons shrink-0 text-zinc-500"
                aria-hidden="true"
              >
                play_arrow
              </span>
            </a>

            <p
              *ngIf="!searchResults().length"
              class="px-4 py-8 text-center text-sm text-zinc-500"
            >
              No matching movies found.
            </p>
          </ng-container>
        </div>

        <!-- Footer -->
        <div
          class="flex shrink-0 items-center justify-between gap-3 border-t border-white/10 px-4 py-3 text-xs text-zinc-500"
        >
          <span>Search Neo4flix</span>
          <span>Enter to view all results · Esc to close</span>
        </div>
      </section>
    </div>
  `,
})
export class SearchComponent {
  private readonly movieService = inject(MovieService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchChanges = new Subject<string>();

  @ViewChild("searchInput")
  private searchInput?: ElementRef<HTMLInputElement>;

  @Output()
  readonly searchSubmitted = new EventEmitter<string>();

  readonly searchOpen = signal(false);
  readonly searchTerm = signal("");
  readonly searchResults = signal<Movie[]>([]);
  readonly searchLoading = signal(false);

  constructor() {
    this.searchChanges
      .pipe(
        map((term) => term.trim()),
        debounceTime(250),
        distinctUntilChanged(),
        switchMap((term) => {
          if (!term) {
            this.searchLoading.set(false);
            return of(null);
          }

          this.searchLoading.set(true);

          return this.movieService
            .getMovies({
              search: term,
              genre: "",
              year: null,
              page: 0,
              size: 8,
            })
            .pipe(
              catchError(() => of(null)),
              finalize(() => this.searchLoading.set(false)),
            );
        }),
        tap((response) => {
          const results: Movie[] = response
            ? (response.content ?? response.movies ?? response.items ?? [])
            : [];

          this.searchResults.set(results);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  openSearch(): void {
    this.searchOpen.set(true);

    setTimeout(() => {
      this.searchInput?.nativeElement.focus();
    });
  }

  closeSearch(): void {
    this.searchOpen.set(false);
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const term = input.value;

    this.searchTerm.set(term);
    this.searchChanges.next(term);
  }

  submitSearch(event?: Event): void {
    event?.preventDefault();

    const search = this.searchTerm().trim();

    if (!search) {
      this.searchInput?.nativeElement.focus();
      return;
    }

    this.closeSearch();
    this.searchSubmitted.emit(search);

    void this.router.navigate(["/browse"], {
      queryParams: { search },
    });
  }

  @HostListener("window:keydown", ["$event"])
  onGlobalKeydown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;

    const typing =
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement ||
      target?.isContentEditable === true;

    if (event.key === "Escape" && this.searchOpen()) {
      this.closeSearch();
      return;
    }

    if (
      (event.ctrlKey || event.metaKey) &&
      event.key.toLowerCase() === "k"
    ) {
      event.preventDefault();
      this.openSearch();
      return;
    }

    if (event.key === "/" && !typing && !this.searchOpen()) {
      event.preventDefault();
      this.openSearch();
    }
  }
}