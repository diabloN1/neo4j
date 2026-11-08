import { CommonModule } from "@angular/common";
import { Component, computed, input } from "@angular/core";
import { UserProfile } from "@/models/user.model";

@Component({
  selector: "app-profile-sidebar",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./profile-sidebar.component.html",
})
export class ProfileSidebarComponent {
  readonly profile = input.required<UserProfile>();

  readonly initials = computed(() => {
    const name = this.profile().name?.trim() ?? "";

    return (
      name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("") || "N"
    );
  });
}
