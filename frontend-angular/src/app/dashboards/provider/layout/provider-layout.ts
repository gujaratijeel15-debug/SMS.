import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../../../components/navbar/navbar';

@Component({
  selector: 'app-provider-layout',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  template: `
    <app-navbar></app-navbar>

    <main class="provider-content">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    .provider-content {
      padding: 0;
      background: #000;
      min-height: calc(100vh - 80px);
      color: white;
    }
  `]
})
export class ProviderLayoutComponent {}
