import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // needed for *ngIf, *ngFor
import { RouterModule } from '@angular/router'; // needed for routerLink
import { NavigationEnd, Router } from '@angular/router';
import { filter, Subscription } from 'rxjs';

type FooterColumn = {
  title: string;
  links: Array<{ label: string; route: string }>;
};

@Component({
  selector: 'app-footer',
  standalone: true, // <--- ADD THIS
  imports: [CommonModule, RouterModule], // <--- ADD THIS (so links work)
  templateUrl: './footer.html',
  styleUrls: ['./footer.css']
})
export class FooterComponent implements OnInit, OnDestroy {
  panel: 'user' | 'provider' | 'public' = 'public';
  columns: FooterColumn[] = [];
  description = 'Smart Service Management platform to manage home services, bookings, and providers in one place.';
  private navSub?: Subscription;

  constructor(private router: Router) { }

  ngOnInit(): void {
    this.updateFooterByUrl(this.router.url);
    this.navSub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.updateFooterByUrl(event.urlAfterRedirects || event.url);
      });
  }

  ngOnDestroy(): void {
    this.navSub?.unsubscribe();
  }

  private updateFooterByUrl(url: string): void {
    if (url.startsWith('/provider')) {
      this.panel = 'provider';
      this.description = 'Provider workspace for managing requests, jobs, earnings, and service visibility.';
      this.columns = [
        {
          title: 'Provider Panel',
          links: [
            { label: 'Dashboard', route: '/provider/dashboard' },
            { label: 'Requests', route: '/provider/requests' },
            { label: 'Active Jobs', route: '/provider/active-jobs' },
            { label: 'History', route: '/provider/history' }
          ]
        },
        {
          title: 'Account',
          links: [
            { label: 'Profile', route: '/provider/profile' },
            { label: 'Earnings', route: '/provider/earnings' },
            { label: 'About', route: '/provider/about' },
            { label: 'Help Center', route: '/provider/help' }
          ]
        }
      ];
      return;
    }

    if (url.startsWith('/user')) {
      this.panel = 'user';
      this.description = 'User workspace for booking services, tracking jobs, reviews, and account management.';
      this.columns = [
        {
          title: 'User Panel',
          links: [
            { label: 'Dashboard', route: '/user/dashboard' },
            { label: 'Book Service', route: '/user/book' },
            { label: 'My Bookings', route: '/user/bookings' },
            { label: 'Profile', route: '/user/profile' }
          ]
        },
        {
          title: 'Support',
          links: [
            { label: 'About', route: '/user/about' },
            { label: 'Contact', route: '/user/contact' },
            { label: 'Help Center', route: '/user/help' },
            { label: 'Home', route: '/home' }
          ]
        }
      ];
      return;
    }

    this.panel = 'public';
    this.description = 'Smart Service Management platform to manage home services, bookings, and providers in one place.';
    this.columns = [
      {
        title: 'Company',
        links: [
          { label: 'Home', route: '/home' },
          { label: 'About', route: '/about' },
          { label: 'Contact', route: '/contact' },
          { label: 'Help Center', route: '/help' }
        ]
      },
      {
        title: 'Platform',
        links: [
          { label: 'Register', route: '/auth/register' },
          { label: 'Login', route: '/auth/login' },
          { label: 'User Dashboard', route: '/user/dashboard' },
          { label: 'Provider Dashboard', route: '/provider/dashboard' }
        ]
      }
    ];
  }

  onSubscribe() {
    console.log('User clicked subscribe');
  }
}
