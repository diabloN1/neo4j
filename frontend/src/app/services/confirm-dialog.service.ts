import { Injectable, signal } from "@angular/core";

export interface ConfirmOptions {
  title?: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "destructive" | "default";
}

@Injectable({ providedIn: "root" })
export class ConfirmDialogService {
  readonly isOpen = signal(false);
  readonly options = signal<ConfirmOptions>({
    title: "Are you absolutely sure?",
    description: "This action cannot be undone.",
    confirmText: "Continue",
    cancelText: "Cancel",
    variant: "destructive",
  });

  private resolvePromise?: (value: boolean) => void;

  confirm(options: ConfirmOptions): Promise<boolean> {
    this.options.set({
      title: options.title ?? "Are you absolutely sure?",
      description: options.description,
      confirmText:
        options.confirmText ??
        (options.variant === "destructive" ? "Delete" : "Continue"),
      cancelText: options.cancelText ?? "Cancel",
      variant: options.variant ?? "destructive",
    });

    this.isOpen.set(true);

    console.log("2. ConfirmDialogService.confirm called!");

    return new Promise<boolean>((resolve) => {
      this.resolvePromise = resolve;
    });
  }

  handleConfirm(): void {
    this.close(true);
  }

  handleCancel(): void {
    this.close(false);
  }

  private close(result: boolean): void {
    this.isOpen.set(false);
    if (this.resolvePromise) {
      this.resolvePromise(result);
      this.resolvePromise = undefined;
    }
  }
}
