import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UserService } from '../../../../services/user';

@Component({
  selector: 'app-review',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './review.html',
  styleUrls: ['./review.css']
})
export class ReviewComponent implements OnInit {
  bookingId = '';
  booking: any = null;
  completedBookings: any[] = [];
  rating = 0;
  response = '';
  loading = false;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.bookingId = params.get('id') || '';
      this.booking = null;
      this.error = '';
      this.rating = 0;
      this.response = '';

      if (this.bookingId) {
        this.loadBookingById();
      } else {
        this.loadCompletedBookings();
      }
    });
  }

  loadCompletedBookings() {
    this.userService.getMyBookings().subscribe({
      next: (bookings: any[]) => {
        this.completedBookings = (bookings || []).filter(
          b => b?.status === 'completed' && !b?.review?.rating
        );
      },
      error: () => {
        this.error = 'Failed to load completed bookings';
      }
    });
  }

  loadBookingById() {
    this.userService.getMyBookings().subscribe({
      next: (bookings: any[]) => {
        this.booking = (bookings || []).find(b => b._id === this.bookingId) || null;
        if (!this.booking) this.error = 'Booking not found';
      },
      error: () => {
        this.error = 'Failed to load booking';
      }
    });
  }

  chooseBooking(bookingId: string) {
    this.router.navigate(['/user/review', bookingId]);
  }

  setRating(value: number) {
    this.rating = value;
  }

  submitReview() {
    if (!this.booking) return;
    if (this.booking.status !== 'completed') {
      this.error = 'Review is allowed only for completed bookings';
      return;
    }
    if (this.rating < 1 || this.rating > 5) {
      this.error = 'Please select rating from 1 to 5';
      return;
    }
    if (!this.response.trim()) {
      this.error = 'Please write your review response';
      return;
    }

    this.loading = true;
    this.error = '';

    this.userService.submitReview(this.bookingId, {
      rating: this.rating,
      response: this.response.trim()
    }).subscribe({
      next: () => {
        this.loading = false;
        alert('Review submitted successfully');
        this.router.navigate(['/user/bookings']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Failed to submit review';
      }
    });
  }
}
