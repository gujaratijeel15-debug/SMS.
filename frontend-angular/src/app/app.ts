import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { CommonModule, DOCUMENT } from '@angular/common';
import { NavbarComponent } from './components/navbar/navbar';
import { filter } from 'rxjs';
import { SessionService } from './services/session.service'; // Adjust path if needed
import { FooterComponent } from './components/footer/footer'; // 👈 Import it (adjust path as needed)



@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent,FooterComponent],
template: `
    <app-navbar *ngIf="showNavbar"></app-navbar>
    
    <router-outlet></router-outlet>
    
    <app-footer *ngIf="showNavbar"></app-footer>
  `
})
export class App implements OnInit, OnDestroy {

  showNavbar = true;
  private document = inject(DOCUMENT);

  constructor(
    private router: Router,
    private session: SessionService // 1. Inject SessionService
  ) {
    // Handle Navbar visibility
    this.updateNavbar(this.router.url);

    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        const url = e.urlAfterRedirects || e.url;
        this.updateNavbar(url);
        this.clearFormAutofill();
      });
  }

  ngOnInit() {
    // 2. TRIGGER THE CHECK ON LOAD
    // This calls the API, checks the user, and sets ready = true
    this.session.bootstrap().subscribe({
      next: () => console.log('Session check complete'),
      error: () => console.log('Session check failed (user logged out)')
    });

  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const currentPath = (this.router.url || '').split('?')[0];
  const canAutoRedirect = currentPath === '/' || currentPath.startsWith('/auth');

  if (token && role && canAutoRedirect) {
    if (role === 'user') this.router.navigate(['/user/dashboard']);
    else if (role === 'provider') this.router.navigate(['/provider/dashboard']);
    else if (role === 'admin') this.router.navigate(['/admin/dashboard']);
  }

  this.clearFormAutofill();
  }

  ngOnDestroy(): void {}

  private updateNavbar(url: string) {
    this.showNavbar = !url.startsWith('/auth') && !url.startsWith('/admin');
  }

  private clearFormAutofill() {
    const run = () => {
      const forms = this.document.querySelectorAll('form');
      forms.forEach(form => form.setAttribute('autocomplete', 'off'));

      const fields = this.document.querySelectorAll('input, textarea');
      fields.forEach((node: Element) => {
        const field = node as HTMLInputElement | HTMLTextAreaElement;
        field.setAttribute('autocomplete', 'off');

        if (!(field instanceof HTMLInputElement)) return;

        const type = String(field.type || '').toLowerCase();
        const shouldClear = ['text', 'email', 'password', 'search', 'tel', 'url', 'number'].includes(type);
        if (!shouldClear) return;

        if (field.value) {
          field.value = '';
          field.dispatchEvent(new Event('input', { bubbles: true }));
          field.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
    };

    setTimeout(run, 0);
    setTimeout(run, 250);
  }
}


