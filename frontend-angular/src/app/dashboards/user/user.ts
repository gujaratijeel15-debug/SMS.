import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/user';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user.html',
  styleUrls: ['./user.css']
})
export class UserComponent implements OnInit {

  bookings: any[] = [];
  serviceId: string = '';

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.loadBookings();
  }

  loadBookings() {
    this.userService.getMyBookings().subscribe(data => {
      this.bookings = data;
    });
  }

  createBooking() {
    if (!this.serviceId) return;

    this.userService.createBooking(this.serviceId).subscribe(() => {
      this.serviceId = '';
      this.loadBookings();
    });
  }
}
