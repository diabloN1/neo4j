import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { AuthService } from '@/services/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    ZardButtonComponent,
  ],
  template: `
    <main class="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12 text-foreground">
      <!-- Cinematic background -->
      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div class="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl"></div>
        <div class="absolute -bottom-40 -right-24 h-[30rem] w-[30rem] rounded-full bg-primary/10 blur-3xl"></div>
        <div class="absolute inset-0 bg-gradient-to-b from-background/20 via-background to-background"></div>
      </div>

      <section class="relative z-10 w-full max-w-md">
        <!-- Brand -->
        <a
          routerLink="/catalog"
          class="mb-8 flex items-center justify-center gap-3"
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

        <!-- Login card -->
        <div class="rounded-2xl border border-border bg-card/95 p-6 shadow-2xl backdrop-blur sm:p-8">
          <div class="mb-7">
            <p class="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-primary">
              Welcome back
            </p>

            <h1 class="text-3xl font-bold tracking-tight">
              Sign in
            </h1>

            <p class="mt-2 text-sm leading-6 text-muted-foreground">
              Sign in to discover movies picked for you.
            </p>
          </div>

          <form
            [formGroup]="form"
            (ngSubmit)="submit()"
            class="space-y-5"
            novalidate
          >
            <!-- Email -->
            <div class="space-y-2">
              <label for="login-email" class="text-sm font-medium">
                Email address
              </label>

              <input
                id="login-email"
                type="email"
                formControlName="email"
                autocomplete="email"
                placeholder="you@example.com"
                class="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                [attr.aria-invalid]="
                  form.controls.email.invalid && form.controls.email.touched
                "
                [attr.aria-describedby]="
                  form.controls.email.invalid && form.controls.email.touched
                    ? 'login-email-error'
                    : null
                "
              />

              @if (
                form.controls.email.touched &&
                form.controls.email.hasError('required')
              ) {
                <p id="login-email-error" class="text-sm text-destructive">
                  Email is required.
                </p>
              } @else if (
                form.controls.email.touched &&
                form.controls.email.hasError('email')
              ) {
                <p id="login-email-error" class="text-sm text-destructive">
                  Enter a valid email address.
                </p>
              }
            </div>

            <!-- Password -->
            <div class="space-y-2">
              <div class="flex items-center justify-between gap-3">
                <label for="login-password" class="text-sm font-medium">
                  Password
                </label>
              </div>

              <input
                id="login-password"
                type="password"
                formControlName="password"
                autocomplete="current-password"
                placeholder="Enter your password"
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

            <!-- Submit -->
            <button
              z-button
              type="submit"
              class="w-full"
              [disabled]="busy()"
            >
              {{ busy() ? 'Signing in…' : 'Sign in' }}
            </button>
          </form>

          <div class="my-6 flex items-center gap-3">
            <div class="h-px flex-1 bg-border"></div>
            <span class="text-xs text-muted-foreground">NEW TO NEO4FLIX?</span>
            <div class="h-px flex-1 bg-border"></div>
          </div>

          <a
            routerLink="/register"
            class="flex h-11 w-full items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-semibold transition hover:bg-accent hover:text-accent-foreground"
          >
            Create an account
          </a>
        </div>

        <p class="mt-6 text-center text-xs leading-5 text-muted-foreground">
          Your next favorite movie is waiting.
        </p>
      </section>
    </main>
  `,
})
export class LoginPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly busy = signal(false);
  readonly error = signal('');

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  submit(): void {
    this.error.set('');

    if (this.form.invalid || this.busy()) {
      this.form.markAllAsTouched();
      return;
    }

    this.busy.set(true);

    this.authService
      .login(this.form.getRawValue())
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: () => {
          void this.router.navigateByUrl('/catalog');
        },
        error: (err: unknown) => {
          this.error.set(
            this.getErrorMessage(
              err,
              'Unable to sign in. Check your credentials and try again.',
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