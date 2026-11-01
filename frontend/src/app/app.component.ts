import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { SearchComponent } from "./shared/components/search/search.component";
import { ZardButtonComponent } from "./shared/components/button";
import { AuthService } from "./services/auth.service";
import { ConfirmDialogComponent } from "./shared/components/confirm-dialog/confirm-dialog.component";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    ZardButtonComponent,
    SearchComponent,
    ConfirmDialogComponent,
  ],
  templateUrl: "./app.component.html",
})
export class AppComponent {
  readonly authService = inject(AuthService);
}
