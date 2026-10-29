import { Movie } from '@/models/movie.model';
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WatchlistService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `/api/watchlist`;

  findMoviesByUser(): Observable<Movie[]> {
    return this.http.get<Movie[]>(this.apiUrl);
  }

  inWatchList(movieId: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/${movieId}/exists`);
  }

  addWatchlist(movieId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${movieId}`, {});
  }

  removeWatchlist(movieId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${movieId}`);
  }
}