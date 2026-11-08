import { CommonModule } from "@angular/common";
import { Component, DestroyRef, inject, signal } from "@angular/core";
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from "@angular/forms";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { finalize } from "rxjs";

import { UserService } from "@/services/user.service";

const passwordsMatch: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const password = control.get("newPassword")?.value;
  const confirmation = control.get("confirmPassword")?.value;

  return password && confirmation && password !== confirmation
    ? { passwordsMismatch: true }
    : null;
};

@Component({
  selector: "app-password-security",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: "./password-security.component.html",
})
export class PasswordSecurityComponent {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly destroyRef = inject(DestroyRef);

  readonly changingPassword = signal(false);
  readonly passwordMessage = signal("");
  readonly passwordError = signal("");

  readonly passwordForm = this.fb.nonNullable.group(
    {
      currentPassword: ["", [Validators.required]],
      newPassword: [
        "",
        [
          Validators.required,
          Validators.minLength(6),
          Validators.maxLength(100),
        ],
      ],
      confirmPassword: ["", [Validators.required]],
    },
    { validators: passwordsMatch },
  );

  changePassword(): void {
    this.passwordMessage.set("");
    this.passwordError.set("");

    if (this.passwordForm.invalid || this.changingPassword()) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const { currentPassword, newPassword } = this.passwordForm.getRawValue();

    this.changingPassword.set(true);

    this.userService
      .changePassword({ currentPassword, newPassword })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.changingPassword.set(false)),
      )
      .subscribe({
        next: () => {
          this.passwordForm.reset();
          this.passwordMessage.set(
            "Your password has been changed successfully.",
          );
        },
        error: (error: {
          error?: {
            details?: Record<string, string>;
            message?: string;
          };
        }) => {
          this.passwordError.set(this.errorMessage(error));
        },
      });
  }

  private errorMessage(error: unknown): string {
    if (typeof error === "object" && error !== null && "error" in error) {
      const body = (
        error as {
          error?: {
            details?: Record<string, string>;
            message?: string;
          };
        }
      ).error;

      const details = body?.details;

      if (details && typeof details === "object") {
        const firstError = Object.values(details)[0];

        if (typeof firstError === "string" && firstError.trim()) {
          return firstError;
        }
      }

      if (typeof body?.message === "string" && body.message.trim()) {
        return body.message;
      }
    }

    return "Error updating the password";
  }
}
