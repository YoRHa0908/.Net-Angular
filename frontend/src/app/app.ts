import { Component } from '@angular/core';
import { NgIf } from '@angular/common';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { ToastContainerComponent } from './shared/toast-container.component';
import { AuthService } from './core/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, ToastContainerComponent, NgIf],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  constructor(
    public readonly auth: AuthService,
    private readonly router: Router
  ) {}

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
