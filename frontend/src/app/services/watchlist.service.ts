import { Movie, MoviePage } from "@/models/movie.model";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class WatchlistService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `/api/watchlist`;

  findMoviesByUser(page: number, size: number): Observable<MoviePage<Movie>> {
    const params = new HttpParams().set("page", page).set("size", size);

    return this.http.get<MoviePage<Movie>>(this.apiUrl, { params });
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
