import { Component, effect, HostListener, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ConfirmDialogService } from "@/services/confirm-dialog.service";

@Component({
  selector: "app-confirm-dialog",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./confirm-dialog.component.html",
})
export class ConfirmDialogComponent {
  readonly dialogService = inject(ConfirmDialogService);

  constructor() {
    effect(() => {
      console.log("Dialog isOpen changed to:", this.dialogService.isOpen());
    });
  }
  @HostListener("document:keydown.escape")
  onEscape(): void {
    if (this.dialogService.isOpen()) {
      this.dialogService.handleCancel();
    }
  }
}
