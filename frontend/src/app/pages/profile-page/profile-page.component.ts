import { CommonModule } from "@angular/common";
import { Component, DestroyRef, OnInit, inject, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { finalize } from "rxjs";

import { UserService } from "@/services/user.service";
import { UserProfile } from "@/models/user.model";
import { UserRatingsComponent } from "@/shared/components/user-ratings/user-ratings.component";

import { ProfileSidebarComponent } from "./components/profile-sidebar/profile-sidebar.component";
import { PersonalInformationComponent } from "./components/personal-information/personal-information.component";
import { PasswordSecurityComponent } from "./components/password-security/password-security.component";
import { TwoFactorAuthenticationComponent } from "./components/two-factor-authentication/two-factor-authentication.component";
import { DangerZoneComponent } from "./components/danger-zone/danger-zone.component";

@Component({
  selector: "app-profile-page",
  standalone: true,
  imports: [
    CommonModule,
    UserRatingsComponent,
    ProfileSidebarComponent,
    PersonalInformationComponent,
    PasswordSecurityComponent,
    TwoFactorAuthenticationComponent,
    DangerZoneComponent,
  ],
  templateUrl: "./profile-page.component.html",
})
export class ProfilePageComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly destroyRef = inject(DestroyRef);

  readonly profile = signal<UserProfile | null>(null);
  readonly loadingProfile = signal(true);
  readonly loadError = signal("");

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.loadingProfile.set(true);
    this.loadError.set("");

    this.userService
      .getProfile()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loadingProfile.set(false)),
      )
      .subscribe({
        next: (profile) => this.profile.set(profile),
        error: (error: unknown) => {
          this.loadError.set(
            this.errorMessage(
              error,
              "Unable to load your account. Please try again.",
            ),
          );
        },
      });
  }

  private errorMessage(error: unknown, fallback: string): string {
    if (typeof error === "object" && error !== null && "error" in error) {
      const body = (error as { error?: { message?: unknown } }).error;

      if (typeof body?.message === "string" && body.message.trim()) {
        return body.message;
      }
    }

    return fallback;
  }
}
