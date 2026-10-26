import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Movie, MoviePage, MovieQuery } from '../models/movie.model';

@Injectable({ providedIn: 'root' })
export class MovieService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8081/api/movies';

  getMovies(query: MovieQuery): Observable<MoviePage> {
    let params = new HttpParams().set('page', query.page).set('size', query.size);
    const search = query.search?.trim();
    if (search) params = params.set('search', search);
    if (query.genre) params = params.set('genre', query.genre);
    if (query.year) params = params.set('year', query.year);

    return this.http.get<MoviePage | Movie[]>(this.apiUrl, { params }).pipe(
      map((response) => Array.isArray(response)
        ? { content: response, totalPages: 1, totalElements: response.length, number: query.page, size: query.size }
        : response)
    );
  }

  getGenres(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/genres`);
  }

  getMovieByTitle(title: string): Observable<Movie> {
    return this.http.get<Movie>(`${this.apiUrl}/${encodeURIComponent(title)}`);
  }
}
