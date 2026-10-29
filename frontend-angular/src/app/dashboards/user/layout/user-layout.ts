import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-user-layout',
  imports: [CommonModule, RouterModule],
  templateUrl: './user-layout.html'
})
export class UserLayoutComponent {}
