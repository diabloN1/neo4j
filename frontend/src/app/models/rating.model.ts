export interface RatingResponse {
  movieId: string;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserRatings {
  movieId: string;
  movieTitle: string;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

export interface RatingAverageResponse {
  movieId: string;
  averageRating: number;
  ratingCount: number;
}
