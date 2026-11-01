import { Routes } from "@angular/router";
import { authGuard } from "./guards/auth.guard";

export const routes: Routes = [
  {
    path: "login",
    loadComponent: () =>
      import("./pages/login-page/login-page.component").then(
        (m) => m.LoginPageComponent,
      ),
  },
  {
    path: "register",
    loadComponent: () =>
      import("./pages/register-page/register-page.component").then(
        (m) => m.RegisterPageComponent,
      ),
  },
  { path: "", pathMatch: "full", redirectTo: "movies" },
  {
    path: "movies",
    loadComponent: () =>
      import("./pages/catalog-page/catalog-page.component").then(
        (m) => m.CatalogPageComponent,
      ),
  },
  {
    path: "browse",
    loadComponent: () =>
      import("./pages/search-page/search-page.component").then(
        (m) => m.SearchComponent,
      ),
  },
  {
    path: "movies/:id",
    loadComponent: () =>
      import("./pages/movie-detail-page/movie-detail-page.component").then(
        (m) => m.MovieDetailPageComponent,
      ),
  },
  {
    path: "profile",
    canActivate: [authGuard],
    loadComponent: () =>
      import("./pages/profile-page/profile-page.component").then(
        (m) => m.ProfilePageComponent,
      ),
  },
  {
    path: "my-movies",
    loadComponent: () =>
      import("./pages/my-movies-page/my-movies-page.component").then(
        (m) => m.MyMoviesPageComponent,
      ),
  },
  {
    path: "recommendations",
    loadComponent: () =>
      import("./pages/recommendations-page/recommendations-page.component").then(
        (m) => m.RecommendationsPageComponent,
      ),
  },
  {
    path: "watchlist",
    loadComponent: () =>
      import("./pages/watchlist-page/watchlist-page.component").then(
        (m) => m.WatchlistPageComponent,
      ),
  },
  { path: "**", redirectTo: "movies" },
];
