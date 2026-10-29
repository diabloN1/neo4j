import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { Movie, MoviePage, MovieQuery } from "../models/movie.model";

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
    if (query.genre) params = params.set("genre", query.genre);
    if (query.year) params = params.set("year", query.year);

    return this.http.get<MoviePage>(this.apiUrl, { params });
  }

  getGenres(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/genres`);
  }

  getMovieById(id: string): Observable<Movie> {
    return this.http.get<Movie>(`${this.apiUrl}/${id}`);
  }
}
