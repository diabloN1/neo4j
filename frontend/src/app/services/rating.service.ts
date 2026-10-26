import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';


export interface RatingRequest {
  rating: number;
}

export interface RatingResponse {
  movieId: string;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

export interface RatingAverageResponse {
  movieId: string;
  averageRating: number;
  ratingCount: number;
}

@Injectable({
  providedIn: 'root',
})
export class RatingService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8083/api/ratings';

  rateMovie(movieId: string, rating: number): Observable<RatingResponse> {
    return this.http.post<RatingResponse>(
      `${this.apiUrl}/${encodeURIComponent(movieId)}`,
      { rating },
    );
  }

  getMyRatings(): Observable<RatingResponse[]> {
    return this.http.get<RatingResponse[]>(`${this.apiUrl}/me`);
  }

  getMyRating(movieId: string): Observable<RatingResponse> {
    return this.http.get<RatingResponse>(
      `${this.apiUrl}/${encodeURIComponent(movieId)}`,
    );
  }

  updateRating(movieId: string, rating: number): Observable<RatingResponse> {
    return this.http.put<RatingResponse>(
      `${this.apiUrl}/${encodeURIComponent(movieId)}`,
      { rating },
    );
  }

  deleteRating(movieId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${encodeURIComponent(movieId)}`,
    );
  }

  getMovieRatingAverage(
    movieId: string,
  ): Observable<RatingAverageResponse> {
    return this.http.get<RatingAverageResponse>(
      `${this.apiUrl}/movies/${encodeURIComponent(movieId)}/average`,
    );
  }
}