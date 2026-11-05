import { CommonModule } from "@angular/common";
import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from "@angular/core";
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from "@angular/forms";
import { Router } from "@angular/router";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { finalize } from "rxjs";
import * as QRCode from "qrcode";

import { UserRatingsComponent } from "@/shared/components/user-ratings/user-ratings.component";

import { AuthService } from "@/services/auth.service";
import { UserService } from "@/services/user.service";
import { UserProfile } from "@/models/user.model";

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
  selector: "app-profile-page",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, UserRatingsComponent],
  templateUrl: "profile-page.component.html",
})
export class ProfilePageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly profile = signal<UserProfile | null>(null);

  readonly loadingProfile = signal(true);
  readonly loadError = signal("");

  readonly savingProfile = signal(false);
  readonly changingPassword = signal(false);
  readonly deletingAccount = signal(false);
  readonly deleteExpanded = signal(false);

  readonly profileMessage = signal("");
  readonly profileError = signal("");
  readonly passwordMessage = signal("");
  readonly passwordError = signal("");
  readonly deleteError = signal("");

  // MFA state
  readonly mfaEnabled = signal(false);
  readonly loadingMfaStatus = signal(true);
  readonly settingUpMfa = signal(false);
  readonly confirmingMfa = signal(false);
  readonly generatingQr = signal(false);

  readonly mfaSetupVisible = signal(false);
  readonly provisioningUri = signal("");
  readonly qrCodeDataUrl = signal("");

  readonly mfaMessage = signal("");
  readonly mfaError = signal("");

  readonly disablingMfa = signal(false);
  readonly disableMfaMessage = signal("");
  readonly disableMfaError = signal("");

  readonly initials = computed(() => {
    const name = this.profile()?.name?.trim() ?? "";

    return (
      name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("") || "N"
    );
  });

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

  readonly deleteForm = this.fb.nonNullable.group({
    password: ["", [Validators.required]],
  });

  readonly mfaForm = this.fb.nonNullable.group({
    code: ["", [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  ngOnInit(): void {
    this.loadProfile();
    this.loadMfaStatus();
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
        next: (profile) => {
          this.profile.set(profile);
          this.profileForm.reset({
            name: profile.name,
            email: profile.email,
          });
        },
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
          this.profile.set(response.user);
          this.profileForm.reset({
            name: response.user.name,
            email: response.user.email,
          });
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
        error: (error: unknown) => {
          this.passwordError.set(
            this.errorMessage(
              error,
              "Unable to change your password. Please try again.",
            ),
          );
        },
      });
  }

  // MFA: load current status
  loadMfaStatus(): void {
    this.loadingMfaStatus.set(true);
    this.mfaError.set("");

    this.userService
      .getMfaStatus()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loadingMfaStatus.set(false)),
      )
      .subscribe({
        next: (response) => {
          this.mfaEnabled.set(response.enabled);

          if (response.enabled) {
            this.resetMfaSetup();
          }
        },
        error: (error: unknown) => {
          this.mfaError.set(
            this.errorMessage(error, "Unable to retrieve your MFA status."),
          );
        },
      });
  }

  // MFA: request a new TOTP setup
  setupMfa(): void {
    if (this.settingUpMfa() || this.mfaEnabled()) return;

    this.mfaError.set("");
    this.mfaMessage.set("");
    this.settingUpMfa.set(true);

    this.userService
      .setupTotp()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.settingUpMfa.set(false)),
      )
      .subscribe({
        next: (response) => {
          this.provisioningUri.set(response.provisioningUri);
          this.mfaSetupVisible.set(true);
          this.generateQrCode(response.provisioningUri);
        },
        error: (error: unknown) => {
          this.mfaError.set(
            this.errorMessage(
              error,
              "Unable to start MFA setup. Please try again.",
            ),
          );
        },
      });
  }

  readonly disableMfaForm = this.fb.nonNullable.group({
    currentPassword: ["", Validators.required],
    code: ["", [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  disableMfa(): void {
    if (this.disableMfaForm.invalid || this.disablingMfa()) {
      this.disableMfaForm.markAllAsTouched();
      return;
    }

    this.disablingMfa.set(true);
    this.disableMfaMessage.set("");
    this.disableMfaError.set("");

    this.userService.disableTotp(this.disableMfaForm.getRawValue()).subscribe({
      next: () => {
        this.mfaEnabled.set(false);
        this.disableMfaMessage.set(
          "Two-factor authentication has been disabled.",
        );
        this.disableMfaForm.reset();
        this.disablingMfa.set(false);
        this.loadMfaStatus();
      },
      error: (error) => {
        this.disableMfaError.set(
          error?.error?.message ??
            "Failed to disable two-factor authentication.",
        );
        this.disablingMfa.set(false);
      },
    });
  }

  // Generate QR code locally in the browser
  private async generateQrCode(uri: string): Promise<void> {
    this.generatingQr.set(true);
    this.qrCodeDataUrl.set("");

    try {
      const dataUrl = await QRCode.toDataURL(uri, {
        width: 240,
        margin: 2,
        errorCorrectionLevel: "M",
      });

      this.qrCodeDataUrl.set(dataUrl);
    } catch {
      this.mfaError.set(
        "Unable to generate the QR code. You can use the manual setup URI instead.",
      );
    } finally {
      this.generatingQr.set(false);
    }
  }

  // MFA: confirm TOTP setup using the six-digit code
  confirmMfa(): void {
    this.mfaMessage.set("");
    this.mfaError.set("");

    if (this.mfaForm.invalid || this.confirmingMfa()) {
      this.mfaForm.markAllAsTouched();
      return;
    }

    this.confirmingMfa.set(true);

    this.userService
      .confirmTotp(this.mfaForm.getRawValue())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.confirmingMfa.set(false)),
      )
      .subscribe({
        next: () => {
          this.mfaEnabled.set(true);
          this.mfaMessage.set(
            "Two-factor authentication has been enabled successfully.",
          );
          this.resetMfaSetup();
          this.loadMfaStatus();
        },
        error: (error: unknown) => {
          this.mfaError.set(
            this.errorMessage(
              error,
              "Invalid authentication code. Please try again.",
            ),
          );
        },
      });
  }

  cancelMfaSetup(): void {
    this.resetMfaSetup();
    this.mfaError.set("");
    this.mfaMessage.set("");
  }

  private resetMfaSetup(): void {
    this.mfaSetupVisible.set(false);
    this.provisioningUri.set("");
    this.qrCodeDataUrl.set("");
    this.mfaForm.reset();
  }

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
