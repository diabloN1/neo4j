import { Component } from "@angular/core";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { ZardButtonComponent } from "./shared/components/button";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, ZardButtonComponent],
  template: `
    <div class="dark min-h-screen overflow-hidden bg-zinc-950 text-zinc-100">
      <header
        class="sticky top-0 z-20 border-b border-white/10 bg-zinc-950/90 backdrop-blur-xl"
      >
        <div
          class="mx-auto flex h-16 max-w-7xl items-center gap-8 px-4 sm:px-6 lg:px-8"
        >
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
          <nav class="flex items-center gap-5 text-sm text-zinc-400">
            <a
              routerLink="/movies"
              routerLinkActive="text-white"
              class="transition hover:text-white"
              >Discover</a
            >
            <span
              class="hidden border-l border-white/15 pl-5 text-xs text-zinc-500 sm:inline"
              >Powered by Neo4j</span
            >
          </nav>
          <div
            class="ml-auto hidden items-center gap-2 text-xs text-zinc-400 sm:flex"
          >
            <span class="size-2 rounded-full bg-emerald-400"></span>
            Movie catalog
          </div>
          <div>
            <button z-button class="mx-1">Log-in</button>
            <button z-button zType="secondary">Register</button>
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
            >NEO4FLIX</a
          >
          <p>Built for people who love a good story.</p>
          <span class="ml-auto tracking-[0.18em]">GRAPH-POWERED DISCOVERY</span>
        </div>
      </footer>
    </div>
  `,
})
export class AppComponent {}
