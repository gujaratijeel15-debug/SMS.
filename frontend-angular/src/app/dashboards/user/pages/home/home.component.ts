import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthStateService } from '../../../../services/auth-state.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule], // ✅ REQUIRED
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {

  

  isLoggedIn = false;

  constructor(private router: Router, private authState: AuthStateService) {}

  ngOnInit() {
    this.checkLoginStatus();
    
  }

  checkLoginStatus() {
    this.isLoggedIn = !!localStorage.getItem('token');
  }
logout() {
  localStorage.clear();

  this.authState.setRole(null);

  this.router.navigateByUrl('/home', { replaceUrl: true });
}

}
