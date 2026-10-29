import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { MovieQuery } from "../models/movie.model";
import { MovieRecommendation } from "@/models/recommendation";

@Injectable({ providedIn: "root" })
export class RecommandationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = "http://localhost:8084/api/recommandations";

  getRecommandations(query: MovieQuery): Observable<MovieRecommendation[]> {
    const skip = query.page * query.size;

    let params = new HttpParams().set("skip", skip).set("limit", query.size);

    if (query.genre) params = params.set("genre", query.genre);
    if (query.year != null) params = params.set("year", query.year);

    return this.http.get<MovieRecommendation[]>(this.apiUrl, { params });
  }
}
