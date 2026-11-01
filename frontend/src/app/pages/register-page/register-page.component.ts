import { CommonModule } from "@angular/common";
import { Component, inject, signal } from "@angular/core";
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { finalize } from "rxjs";

import { ZardButtonComponent } from "@/shared/components/button/button.component";
import { AuthService } from "@/services/auth.service";

// Confirms that password and confirmPassword match
function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const password = control.get("password")?.value;
  const confirmPassword = control.get("confirmPassword")?.value;

  if (!password || !confirmPassword) {
    return null;
  }

  return password === confirmPassword ? null : { passwordsMismatch: true };
}

// Custom validator ensuring all criteria are fulfilled
function passwordStrengthValidator(
  control: AbstractControl,
): ValidationErrors | null {
  const value = control.value || "";
  const hasMinLength = value.length >= 8;
  const hasUppercase = /[A-Z]/.test(value);
  const hasNumber = /\d/.test(value);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(value);

  const isValid = hasMinLength && hasUppercase && hasNumber && hasSpecial;
  return isValid ? null : { passwordComplexity: true };
}

@Component({
  selector: "app-register-page",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ZardButtonComponent],
  templateUrl: "register-page.component.html",
})
export class RegisterPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly busy = signal(false);
  readonly error = signal("");

  readonly form = this.fb.nonNullable.group(
    {
      name: [
        "",
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(25),
        ],
      ],
      email: ["", [Validators.required, Validators.email]],
      password: ["", [Validators.required, passwordStrengthValidator]],
      confirmPassword: ["", [Validators.required]],
    },
    { validators: passwordsMatch },
  );

  /**
   * Password criteria list evaluated in real-time
   */
  get passwordCriteria() {
    const password = this.form.controls.password.value || "";
    return [
      {
        id: "length",
        label: "At least 8 characters",
        valid: password.length >= 8,
      },
      {
        id: "uppercase",
        label: "At least 1 uppercase letter (A-Z)",
        valid: /[A-Z]/.test(password),
      },
      {
        id: "number",
        label: "At least 1 number (0-9)",
        valid: /\d/.test(password),
      },
      {
        id: "special",
        label: "At least 1 special character (!@#$...)",
        valid: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password),
      },
    ];
  }

  submit(): void {
    this.error.set("");

    if (this.form.invalid || this.busy()) {
      this.form.markAllAsTouched();
      return;
    }

    const { name, email, password } = this.form.getRawValue();

    this.busy.set(true);

    this.authService
      .register({ name, email, password })
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: () => {
          void this.router.navigateByUrl("/catalog");
        },
        error: (err: unknown) => {
          this.error.set(
            this.getErrorMessage(
              err,
              "Unable to create your account. Please try again.",
            ),
          );
        },
      });
  }

  private getErrorMessage(err: unknown, fallback: string): string {
    if (typeof err === "object" && err !== null && "error" in err) {
      const response = (err as { error?: { message?: unknown } }).error;

      if (typeof response?.message === "string") {
        return response.message;
      }
    }

    return fallback;
  }
}
