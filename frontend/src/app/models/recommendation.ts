export interface MovieRecommendation {
  movieId: string;
  title: string;
  year: number | null;
  imdbRating: number | null;
  poster: string | null;
}