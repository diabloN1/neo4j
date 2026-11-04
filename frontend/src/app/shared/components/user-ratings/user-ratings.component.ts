import { CommonModule } from "@angular/common";
import { Component, Input, signal } from "@angular/core";
import { RouterLink } from "@angular/router";

import { UserRatings } from "@/models/rating.model";

@Component({
  selector: "app-user-ratings",
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: "./user-ratings.component.html",
})
export class UserRatingsComponent {
  @Input({ required: true }) ratings: UserRatings[] = [];

  expanded = signal(false);
}
