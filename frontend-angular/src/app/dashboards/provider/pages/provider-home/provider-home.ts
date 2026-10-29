import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthStateService } from '../../../../services/auth-state.service';

@Component({
  selector: 'app-provider-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './provider-home.html',
  styleUrl: './provider-home.css'
})
export class ProviderHomeComponent implements OnInit {

  isLoggedIn = false;

  constructor(private router: Router, private authState: AuthStateService) {}

  ngOnInit() {
    this.checkLoginStatus();
  }

  checkLoginStatus() {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    // provider only
    this.isLoggedIn = !!token && role === 'provider';
  }
logout() {
  localStorage.clear();

  this.authState.setRole(null);

  this.router.navigateByUrl('/home', { replaceUrl: true });
}

}
