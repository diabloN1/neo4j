import { CommonModule } from "@angular/common";
import { Component, OnInit, inject, signal, computed } from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { EMPTY, catchError, finalize, map, of, switchMap, tap } from "rxjs";


import { NgIconComponent, provideIcons } from "@ng-icons/core";
import {
  siWhatsapp,
  siX,
  siFacebook,
  siTelegram,
  siReddit,
  siGmail,
} from "@ng-icons/simple-icons";

import { Movie } from "../../models/movie.model";
import { MovieService } from "../../services/movie.service";
import { WatchlistService } from "../../services/watchlist.service";
import { ZardBadgeComponent } from "@/shared/components/badge/badge.component";
import { ZardButtonComponent } from "@/shared/components/button/button.component";
import { ZardCardImports } from "@/shared/components/card/card.imports";
import { StarRatingComponent } from "@/shared/components/star-rating/star-rating.component";

type PlayerProvider = "vidy" | "vidrift";

interface SocialOption {
  id: string;
  name: string;
  icon: string;
  color: string;
  url: string;
}

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
    NgIconComponent, // 2. Add NgIconComponent here
  ],
  viewProviders: [
    // 3. Register icons locally (no app.config edits needed!)
    provideIcons({
      siWhatsapp,
      siX,
      siFacebook,
      siTelegram,
      siReddit,
      siGmail,
    }),
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

  // Share Dialog state
  readonly shareDialogOpen = signal(false);
  readonly copied = signal(false);

  get currentUrl(): string {
    return typeof window !== "undefined" ? window.location.href : "";
  }

  readonly socialList = computed<SocialOption[]>(() => {
    const url = encodeURIComponent(this.currentUrl);
    const title = encodeURIComponent(
      `Watch "${this.movie()?.title ?? "Movie"}" on Neo4flix!`,
    );

    return [
      {
        id: "whatsapp",
        name: "WhatsApp",
        icon: "siWhatsapp",
        color: "bg-[#25D366] text-white hover:brightness-110",
        url: `https://api.whatsapp.com/send?text=${title}%20${url}`,
      },
      {
        id: "x",
        name: "X",
        icon: "siX",
        color:
          "bg-black border border-white/20 text-white hover:border-white/50",
        url: `https://twitter.com/intent/tweet?text=${title}&url=${url}`,
      },
      {
        id: "facebook",
        name: "Facebook",
        icon: "siFacebook",
        color: "bg-[#1877F2] text-white hover:brightness-110",
        url: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      },
      {
        id: "telegram",
        name: "Telegram",
        icon: "siTelegram",
        color: "bg-[#24A1DE] text-white hover:brightness-110",
        url: `https://t.me/share/url?url=${url}&text=${title}`,
      },
      {
        id: "reddit",
        name: "Reddit",
        icon: "siReddit",
        color: "bg-[#FF4500] text-white hover:brightness-110",
        url: `https://reddit.com/submit?url=${url}&title=${title}`,
      },
      {
        id: "email",
        name: "Email",
        icon: "siGmail",
        color: "bg-[#EA4335] text-white hover:brightness-110",
        url: `mailto:?subject=${title}&body=Check%20out%20this%20movie:%20${url}`,
      },
    ];
  });

  readonly playerUrl = computed<SafeResourceUrl | null>(() => {
    const tmdbId = this.movie()?.tmdbId?.trim();
    if (!tmdbId) return null;

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
          this.shareDialogOpen.set(false);
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
                    : `Could not load movie details${error.status ? ` (${error.status})` : ""}.`,
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
                : `Could not load movie details${error.status ? ` (${error.status})` : ""}.`,
          ),
      });
  }

  toggleWatchlist(): void {
    const movieId = this.movie()?.movieId;
    if (!movieId || this.watchlistLoading() || !this.watchlistReady()) return;

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
              : `Could not ${wasInWatchlist ? "remove the movie from" : "add the movie to"} your watchlist${error.status ? ` (${error.status})` : ""}.`,
          );
          return EMPTY;
        }),
        finalize(() => this.watchlistLoading.set(false)),
      )
      .subscribe();
  }

  openShareDialog(): void {
    this.copied.set(false);
    this.shareDialogOpen.set(true);
  }

  closeShareDialog(): void {
    this.shareDialogOpen.set(false);
  }

  copyLink(): void {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(this.currentUrl).then(() => {
        this.copied.set(true);
        setTimeout(() => this.copied.set(false), 2000);
      });
    }
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
