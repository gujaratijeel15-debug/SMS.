import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthStateService } from '../../services/auth-state.service';
import { ProviderService } from '../../services/provider';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css']
})
export class NavbarComponent implements OnInit {
homeRoute = '/home';
helpRoute = '/help';
aboutRoute = '/about';
  // auth state
  isLoggedIn = false;
role: string | null = null;
notificationCount = 0;
  // profile dropdown support (used in HTML)
  menuOpen = false;
  user: any = {};
  defaultAvatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix';

constructor(
  private router: Router,
  private authState: AuthStateService,
  private providerService: ProviderService,
  private elementRef: ElementRef
) {}
ngOnInit() {

  this.authState.role$.subscribe(role => {
    this.role = role;
    this.isLoggedIn = !!localStorage.getItem('token');

    // update home route dynamically
    if (role === 'provider') {
      this.homeRoute = '/provider/home';
      this.helpRoute = '/provider/help';
      this.aboutRoute = '/provider/about';
    } else if (role === 'user') {
      this.homeRoute = '/home';
      this.helpRoute = '/user/help';
      this.aboutRoute = '/user/about';
    } else {
      this.homeRoute = '/home';
      this.helpRoute = '/help';
      this.aboutRoute = '/about';
    }
  });

  this.loadAuthState();
  this.loadLatestProfile();

  // provider notifications polling
if (this.role === 'provider') {
  this.loadNotifications();

  setInterval(() => {
    this.loadNotifications();
  }, 5000); // every 5 seconds
}
}


  loadAuthState() {
    this.isLoggedIn = !!localStorage.getItem('token');
    this.role = localStorage.getItem('role') || '';
    if (this.role === 'provider') {
      this.helpRoute = '/provider/help';
      this.aboutRoute = '/provider/about';
    } else if (this.role === 'user') {
      this.helpRoute = '/user/help';
      this.aboutRoute = '/user/about';
    } else {
      this.helpRoute = '/help';
      this.aboutRoute = '/about';
    }

    // optional: load user info if stored
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      this.user = JSON.parse(storedUser);
    }
  }

  toggleMenu() {
    if (!this.menuOpen) {
      this.loadLatestProfile();
    }
    this.menuOpen = !this.menuOpen;
  }

  loadLatestProfile() {
    if (!this.isLoggedIn) return;

    this.providerService.getProfile().subscribe({
      next: (profile: any) => {
        this.user = {
          ...this.user,
          ...profile
        };
        localStorage.setItem('user', JSON.stringify(this.user));
      },
      error: () => {}
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const clickedInside = this.elementRef.nativeElement.contains(event.target);
    if (!clickedInside) {
      this.menuOpen = false;
    }
  }

  navigate(path: string) {
    this.menuOpen = false;
    this.router.navigateByUrl(path);
  }

  logout() {
  localStorage.clear();

  this.authState.setRole(null);

  this.router.navigateByUrl('/home', { replaceUrl: true });
}

loadNotifications() {
  this.providerService.getNotifications()
    .subscribe((res: any) => {
      this.notificationCount = res.count;
    });
}
}
