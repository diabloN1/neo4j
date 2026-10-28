import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { AuthService } from '@/services/auth.service';

function passwordsMatch(
  control: AbstractControl,
): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

  if (!password || !confirmPassword) {
    return null;
  }

  return password === confirmPassword
    ? null
    : { passwordsMismatch: true };
}

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    ZardButtonComponent,
  ],
  template: `
    <main class="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10 text-foreground">
      <!-- Cinematic background -->
      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div class="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl"></div>
        <div class="absolute -bottom-40 -left-24 h-[30rem] w-[30rem] rounded-full bg-primary/10 blur-3xl"></div>
        <div class="absolute inset-0 bg-gradient-to-b from-background/20 via-background to-background"></div>
      </div>

      <section class="relative z-10 w-full max-w-md">
        <!-- Brand -->
        <a
          routerLink="/catalog"
          class="mb-7 flex items-center justify-center gap-3"
          aria-label="Neo4flix home"
        >
          <span
            class="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-lg font-black text-primary-foreground shadow-lg"
          >
            N
          </span>

          <span class="text-2xl font-black tracking-tight">
            Neo<span class="text-primary">4</span>flix
          </span>
        </a>

        <!-- Registration card -->
        <div class="rounded-2xl border border-border bg-card/95 p-6 shadow-2xl backdrop-blur sm:p-8">
          <div class="mb-6">
            <p class="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-primary">
              Join Neo4flix
            </p>

            <h1 class="text-3xl font-bold tracking-tight">
              Create your account
            </h1>

            <p class="mt-2 text-sm leading-6 text-muted-foreground">
              Build your movie collection and discover what to watch next.
            </p>
          </div>

          <form
            [formGroup]="form"
            (ngSubmit)="submit()"
            class="space-y-4"
            novalidate
          >
           <!-- Name -->
            <div class="space-y-2">
              <label for="register-email" class="text-sm font-medium">
                name
              </label>

              <input
                id="register-name"
                type="text"
                formControlName="name"
                placeholder="Your name"
                class="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                [attr.aria-invalid]="
                  form.controls.name.invalid && form.controls.name.touched
                "
              />

              @if (
                form.controls.name.touched &&
                form.controls.name.hasError('required')
              ) {
                <p class="text-sm text-destructive">
                  Name is required.
                </p>
              } @else if (
                form.controls.name.touched &&
                form.controls.name.hasError('email')
              ) {
                <p class="text-sm text-destructive">
                  Enter a valid email address.
                </p>
              }
            </div>

            <!-- Email -->
            <div class="space-y-2">
              <label for="register-email" class="text-sm font-medium">
                Email address
              </label>

              <input
                id="register-email"
                type="email"
                formControlName="email"
                autocomplete="email"
                placeholder="you@example.com"
                class="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                [attr.aria-invalid]="
                  form.controls.email.invalid && form.controls.email.touched
                "
              />

              @if (
                form.controls.email.touched &&
                form.controls.email.hasError('required')
              ) {
                <p class="text-sm text-destructive">
                  Email is required.
                </p>
              } @else if (
                form.controls.email.touched &&
                form.controls.email.hasError('email')
              ) {
                <p class="text-sm text-destructive">
                  Enter a valid email address.
                </p>
              }
            </div>

            <!-- Password -->
            <div class="space-y-2">
              <label for="register-password" class="text-sm font-medium">
                Password
              </label>

              <input
                id="register-password"
                type="password"
                formControlName="password"
                autocomplete="new-password"
                placeholder="Create a password"
                class="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                [attr.aria-invalid]="
                  form.controls.password.invalid &&
                  form.controls.password.touched
                "
              />

              @if (
                form.controls.password.touched &&
                form.controls.password.hasError('required')
              ) {
                <p class="text-sm text-destructive">
                  Password is required.
                </p>
              } @else if (
                form.controls.password.touched &&
                form.controls.password.hasError('minlength')
              ) {
                <p class="text-sm text-destructive">
                  Password must contain at least 8 characters.
                </p>
              }
            </div>

            <!-- Confirm password -->
            <div class="space-y-2">
              <label for="confirm-password" class="text-sm font-medium">
                Confirm password
              </label>

              <input
                id="confirm-password"
                type="password"
                formControlName="confirmPassword"
                autocomplete="new-password"
                placeholder="Enter your password again"
                class="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                [attr.aria-invalid]="
                  form.controls.confirmPassword.touched &&
                  form.hasError('passwordsMismatch')
                "
              />

              @if (
                form.controls.confirmPassword.touched &&
                form.controls.confirmPassword.hasError('required')
              ) {
                <p class="text-sm text-destructive">
                  Please confirm your password.
                </p>
              } @else if (
                form.controls.confirmPassword.touched &&
                form.hasError('passwordsMismatch')
              ) {
                <p class="text-sm text-destructive">
                  Passwords do not match.
                </p>
              }
            </div>

            <!-- API error -->
            @if (error()) {
              <div
                role="alert"
                class="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
              >
                {{ error() }}
              </div>
            }

            <button
              z-button
              type="submit"
              class="w-full"
              [disabled]="busy()"
            >
              {{ busy() ? 'Creating account…' : 'Create account' }}
            </button>
          </form>

          <div class="my-6 flex items-center gap-3">
            <div class="h-px flex-1 bg-border"></div>
            <span class="text-xs text-muted-foreground">ALREADY A MEMBER?</span>
            <div class="h-px flex-1 bg-border"></div>
          </div>

          <a
            routerLink="/login"
            class="flex h-11 w-full items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-semibold transition hover:bg-accent hover:text-accent-foreground"
          >
            Sign in instead
          </a>
        </div>

        <p class="mt-6 text-center text-xs leading-5 text-muted-foreground">
          One account. A whole universe of movies.
        </p>
      </section>
    </main>
  `,
})
export class RegisterPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly busy = signal(false);
  readonly error = signal('');

  readonly form = this.fb.nonNullable.group(
    {
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(25)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    },
    {
      validators: passwordsMatch,
    },
  );

  submit(): void {
    this.error.set('');

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
          void this.router.navigateByUrl('/catalog');
        },
        error: (err: unknown) => {
          this.error.set(
            this.getErrorMessage(
              err,
              'Unable to create your account. Please try again.',
            ),
          );
        },
      });
  }

  private getErrorMessage(err: unknown, fallback: string): string {
    if (
      typeof err === 'object' &&
      err !== null &&
      'error' in err
    ) {
      const response = (err as { error?: { message?: unknown } }).error;

      if (typeof response?.message === 'string') {
        return response.message;
      }
    }

    return fallback;
  }
}