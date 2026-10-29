import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthStateService } from '../../../services/auth-state.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css'
})
export class AdminLayoutComponent {

  constructor(private router: Router, private authState: AuthStateService) {}

logout() {
  localStorage.clear();

  this.authState.setRole(null);

  this.router.navigateByUrl('/home', { replaceUrl: true });
}

}
