import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'movies' },
  { path: 'movies', loadComponent: () => import('./pages/catalog-page/catalog-page.component').then(m => m.CatalogPageComponent) },
  { path: 'movies/:title', loadComponent: () => import('./pages/movie-detail-page/movie-detail-page.component').then(m => m.MovieDetailPageComponent) },
  { path: '**', redirectTo: 'movies' }
];
