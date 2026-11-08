import { CommonModule } from "@angular/common";
import { Component, DestroyRef, OnInit, inject, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { finalize } from "rxjs";
import * as QRCode from "qrcode";

import { UserService } from "@/services/user.service";

@Component({
  selector: "app-two-factor-authentication",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: "./two-factor-authentication.component.html",
})
export class TwoFactorAuthenticationComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly destroyRef = inject(DestroyRef);

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

  readonly mfaForm = this.fb.nonNullable.group({
    code: ["", [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  readonly disableMfaForm = this.fb.nonNullable.group({
    currentPassword: ["", Validators.required],
    code: ["", [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  ngOnInit(): void {
    this.loadMfaStatus();
  }

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
          void this.generateQrCode(response.provisioningUri);
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

  disableMfa(): void {
    if (this.disableMfaForm.invalid || this.disablingMfa()) {
      this.disableMfaForm.markAllAsTouched();
      return;
    }

    this.disablingMfa.set(true);
    this.disableMfaMessage.set("");
    this.disableMfaError.set("");

    this.userService
      .disableTotp(this.disableMfaForm.getRawValue())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.disablingMfa.set(false)),
      )
      .subscribe({
        next: () => {
          this.mfaEnabled.set(false);
          this.disableMfaMessage.set(
            "Two-factor authentication has been disabled.",
          );
          this.disableMfaForm.reset();
          this.loadMfaStatus();
        },
        error: (error: unknown) => {
          this.disableMfaError.set(
            this.errorMessage(
              error,
              "Failed to disable two-factor authentication.",
            ),
          );
        },
      });
  }

  private resetMfaSetup(): void {
    this.mfaSetupVisible.set(false);
    this.provisioningUri.set("");
    this.qrCodeDataUrl.set("");
    this.mfaForm.reset();
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
