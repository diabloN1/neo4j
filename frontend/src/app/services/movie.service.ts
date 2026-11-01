import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import {
  Movie,
  MoviePage,
  MovieQuery,
  MovieWriteRequest,
} from "../models/movie.model";

@Injectable({ providedIn: "root" })
export class MovieService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = "/api/movies";

  getMovies(query: MovieQuery): Observable<MoviePage> {
    let params = new HttpParams()
      .set("page", query.page)
      .set("size", query.size);

    const search = query.search?.trim();
    if (search) params = params.set("search", search);
    if (query.genre?.trim()) params = params.set("genre", query.genre.trim());
    if (query.year !== undefined && query.year !== null) {
      params = params.set("year", query.year.toString());
    }

    return this.http.get<MoviePage>(this.apiUrl, { params });
  }

  getGenres(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/genres`);
  }

  getMyMovies(): Observable<Movie[]> {
    return this.http.get<Movie[]>(`${this.apiUrl}/owned`);
  }

  getMovieById(id: string): Observable<Movie> {
    return this.http.get<Movie>(`${this.apiUrl}/${encodeURIComponent(id)}`);
  }

  createOwnedMovie(request: MovieWriteRequest): Observable<Movie> {
    return this.http.post<Movie>(this.apiUrl, request);
  }

  updateOwnedMovie(id: string, request: MovieWriteRequest): Observable<Movie> {
    return this.http.put<Movie>(
      `${this.apiUrl}/${encodeURIComponent(id)}`,
      request,
    );
  }

  deleteOwnedMovie(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${encodeURIComponent(id)}`);
  }
}
