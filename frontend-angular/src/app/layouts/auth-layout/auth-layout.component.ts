import { Component, ViewEncapsulation } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './auth-layout.component.html',
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['./auth-layout.component.css']
})
export class AuthLayoutComponent {

  title = '';
  subtitle = '';
  image = '';
  isLoginRoute = false;

  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    // ✅ run once on load
    this.setRouteData();

    // ✅ run on every navigation
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.setRouteData();
      });
  }

  setRouteData() {
    let current = this.route;

    while (current.firstChild) {
      current = current.firstChild;
    }

    if (current.snapshot.data) {
      this.title = current.snapshot.data['title'] || '';
      this.subtitle = current.snapshot.data['subtitle'] || '';
      this.image = current.snapshot.data['image'] || '';
    }

    this.isLoginRoute = current.snapshot.routeConfig?.path === 'login';
  }
}
