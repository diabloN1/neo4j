import { CommonModule } from "@angular/common";
import {
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
} from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { finalize } from "rxjs";

import { UserProfile } from "@/models/user.model";
import { AuthService } from "@/services/auth.service";
import { UserService } from "@/services/user.service";

@Component({
  selector: "app-personal-information",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: "./personal-information.component.html",
})
export class PersonalInformationComponent {
  readonly profile = input.required<UserProfile>();
  readonly profileUpdated = output<UserProfile>();

  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly savingProfile = signal(false);
  readonly profileMessage = signal("");
  readonly profileError = signal("");

  readonly profileForm = this.fb.nonNullable.group({
    name: [
      "",
      [Validators.required, Validators.minLength(2), Validators.maxLength(50)],
    ],
    email: [
      "",
      [Validators.required, Validators.email, Validators.maxLength(254)],
    ],
  });

  constructor() {
    effect(() => {
      const profile = this.profile();

      this.profileForm.reset({
        name: profile.name,
        email: profile.email,
      });
    });
  }

  saveProfile(): void {
    this.profileMessage.set("");
    this.profileError.set("");

    if (this.profileForm.invalid || this.savingProfile()) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const request = this.profileForm.getRawValue();
    this.savingProfile.set(true);

    this.userService
      .updateProfile({
        name: request.name.trim(),
        email: request.email.trim(),
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.savingProfile.set(false)),
      )
      .subscribe({
        next: (response) => {
          this.authService.updateAccessToken(response.accessToken);

          this.profileForm.reset({
            name: response.user.name,
            email: response.user.email,
          });

          this.profileUpdated.emit(response.user);
          this.profileMessage.set("Your account details have been updated.");
        },
        error: (error: unknown) => {
          this.profileError.set(
            this.errorMessage(
              error,
              "Unable to update your details. Please try again.",
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
