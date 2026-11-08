export interface Movie {
  movieId: string;
  title: string;
  year?: number | null;
  tagline?: string | null;
  poster?: string | null;
  tmdbId?: string | null;
  imdbRating?: number | null;
  runtime?: number | null;
  genreNames?: string[];
  actorNames?: string[];
  directorNames?: string[];
  released?: string | null;
  plot?: string | null;
  budget?: number | null;
  revenue?: number | null;
  countries?: string[];
  languages?: string[];
}

export interface MovieWriteRequest {
  title: string;
  year: number | null;
  released: string | null;
  plot: string | null;
  budget: number | null;
  revenue: number | null;
  runtime: number | null;
  countries: string[];
  languages: string[];
  poster: string | null;
  genres: string[];
  actors: string[];
  directors: string[];
}

export interface MoviePage<T> {
  content: T[];
  totalElements: number;
  page: number;
  size: number;
  totalPages: number;
}

export interface MovieQuery {
  search?: string;
  genre?: string;
  year?: number | null;
  page: number;
  size: number;
}
