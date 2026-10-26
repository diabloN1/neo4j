import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { SearchComponent } from "./shared/components/search/search.component";
import { ZardButtonComponent } from "./shared/components/button";
import { AuthService } from "./services/auth.service";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    ZardButtonComponent,
    SearchComponent,
  ],
  template: `
    <div class="dark min-h-screen bg-zinc-950 text-zinc-100">
      <header
        class="sticky top-0 z-30 border-b border-white/10 bg-zinc-950/90"
      >
        <div
          class="mx-auto flex h-16 max-w-7xl items-center gap-5 px-4 sm:gap-8 sm:px-6 lg:px-8"
        >
          <!-- Logo -->
          <a
            class="flex shrink-0 items-center gap-2 font-black tracking-[0.16em]"
            routerLink="/movies"
            aria-label="Neo4flix home"
          >
            <span
              class="grid size-8 place-items-center rounded-lg bg-rose-600 text-lg text-white shadow-lg shadow-rose-950/50"
              >N</span
            >
            <span>NEO<span class="text-rose-500">4</span>FLIX</span>
          </a>

          <!-- Navigation -->
          <nav class="flex items-center gap-4 text-sm text-zinc-400 sm:gap-5">
            <a
              routerLink="/movies"
              routerLinkActive="text-white"
              [routerLinkActiveOptions]="{ exact: true }"
              class="transition hover:text-white"
            >
              Home
            </a>

            <a
              routerLink="/browse"
              routerLinkActive="text-white"
              class="transition hover:text-white"
            >
              Browse
            </a>
          </nav>

          <!-- Search -->
          <app-search class="ml-auto" />

          <!-- Authentication -->
          <div class="hidden items-center gap-2 text-xs text-zinc-400 sm:flex">
            @if (!authService.isAuthenticated()) {
              <button z-button routerLink="/login">Log in</button>
              <button z-button zType="secondary" routerLink="/register">
                Register
              </button>
            } @else {
              <span class="size-2 rounded-full bg-emerald-400"></span>
              <span>Logged in</span>
              <button
                z-button
                zType="destructive"
                (click)="authService.logout()"
              >
                Logout
              </button>
            }
          </div>
        </div>
      </header>

      <router-outlet />

      <footer class="border-t border-white/10">
        <div
          class="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-6 text-xs text-zinc-500 sm:px-6 lg:px-8"
        >
          <a
            class="font-bold tracking-widest text-zinc-300"
            routerLink="/movies"
          >
            NEO4FLIX
          </a>
          <p>Built for people who love a good story.</p>
          <span class="ml-auto tracking-[0.18em]">
            GRAPH-POWERED DISCOVERY
          </span>
        </div>
      </footer>
    </div>
  `,
})
export class AppComponent {
  readonly authService = inject(AuthService);
}
