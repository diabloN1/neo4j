import { RatingAverageResponse, RatingResponse } from "@/models/rating.model";
import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class RatingService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = "/api/ratings";

  rateMovie(movieId: string, rating: number): Observable<RatingResponse> {
    return this.http.post<RatingResponse>(
      `${this.apiUrl}/${encodeURIComponent(movieId)}`,
      { rating },
    );
  }

  getMyRating(movieId: string): Observable<RatingResponse> {
    return this.http.get<RatingResponse>(
      `${this.apiUrl}/${encodeURIComponent(movieId)}`,
    );
  }

  getMyRatings(): Observable<RatingResponse[]> {
    return this.http.get<RatingResponse[]>(`${this.apiUrl}/me`);
  }

  getMovieRatingAverage(movieId: string): Observable<RatingAverageResponse> {
    return this.http.get<RatingAverageResponse>(
      `${this.apiUrl}/movies/${encodeURIComponent(movieId)}/average`,
    );
  }

  deleteRating(movieId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${encodeURIComponent(movieId)}`,
    );
  }
}
