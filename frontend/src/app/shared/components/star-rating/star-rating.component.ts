import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { ZardButtonComponent } from "../button";

@Component({
  selector: "app-star-rating",
  standalone: true,
  imports: [CommonModule, ZardButtonComponent],
  templateUrl: "./star-rating.component.html",
})
export class StarRatingComponent {
  @Input() value = 0;
  @Output() valueChange = new EventEmitter<number>();

  @Input() label = "Rate this movie";

  readonly stars = [1, 2, 3, 4, 5];

  hoveredRating: number | null = null;

  get displayRating(): number {
    return this.hoveredRating ?? this.value;
  }

  starIcon(star: number): string {
    const rating = this.displayRating;

    if (rating >= star) {
      return "star";
    }

    if (rating >= star - 0.5) {
      return "star_half";
    }

    return "star_border";
  }

  setRating(rating: number): void {
    this.value = rating;
    this.valueChange.emit(rating);
  }

  resetHover(): void {
    this.hoveredRating = null;
  }
}