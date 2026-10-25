export interface Movie {
  title: string;
  year?: number | null;
  tagline?: string | null;
  plot?: string | null;
  poster?: string | null;
  imdbRating?: number | null;
  released?: string | null;
  runtime?: number | null;
  genres?: string[];
  actors?: string[];
  directors?: string[];
}

/** Spring Data Page-like response or the project's custom MoviePage DTO. */
export interface MoviePage {
  content?: Movie[];
  movies?: Movie[];
  items?: Movie[];
  totalPages?: number;
  totalElements?: number;
  number?: number;
  size?: number;
  first?: boolean;
  last?: boolean;
}

export interface MovieQuery {
  search?: string;
  genre?: string;
  year?: number | null;
  page: number;
  size: number;
}
