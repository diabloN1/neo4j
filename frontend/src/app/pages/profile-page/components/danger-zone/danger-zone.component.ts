import { CommonModule } from "@angular/common";
import { Component, DestroyRef, inject, signal } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { finalize } from "rxjs";

import { AuthService } from "@/services/auth.service";
import { UserService } from "@/services/user.service";

@Component({
  selector: "app-danger-zone",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: "./danger-zone.component.html",
})
export class DangerZoneComponent {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly deletingAccount = signal(false);
  readonly deleteExpanded = signal(false);
  readonly deleteError = signal("");

  readonly deleteForm = this.fb.nonNullable.group({
    password: ["", [Validators.required]],
  });

  cancelDelete(): void {
    this.deleteExpanded.set(false);
    this.deleteError.set("");
    this.deleteForm.reset();
  }

  deleteAccount(): void {
    this.deleteError.set("");

    if (this.deleteForm.invalid || this.deletingAccount()) {
      this.deleteForm.markAllAsTouched();
      return;
    }

    this.deletingAccount.set(true);

    this.userService
      .deleteAccount(this.deleteForm.getRawValue())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.deletingAccount.set(false)),
      )
      .subscribe({
        next: () => {
          this.authService.logout();
          void this.router.navigateByUrl("/login");
        },
        error: (error: unknown) => {
          this.deleteError.set(
            this.errorMessage(
              error,
              "Unable to delete your account. Please try again.",
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
