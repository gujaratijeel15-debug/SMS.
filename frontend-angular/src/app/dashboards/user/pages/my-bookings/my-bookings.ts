import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserService } from '../../../../services/user';
import { PaymentService } from '../../../../services/payment.service';
import { BookingFilterPipe } from './booking-filter.pipe';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  selector: 'app-my-bookings',
  imports: [CommonModule, RouterModule, BookingFilterPipe, FormsModule],
  templateUrl: './my-bookings.html',
  styleUrls: ['./my-bookings.css']
})
export class MyBookingsComponent implements OnInit {

  
  bookings: any[] = [];
  loading = true;
  reviewBooking: any = null;
  reviewRating = 0;
  reviewResponse = '';
  reviewLoading = false;
  reviewError = '';
  constructor(
    private userService: UserService,
    private cdr: ChangeDetectorRef,
    private paymentService: PaymentService
  ) {}

  activeFilter = 'all';
searchTerm = '';
selectedBooking: any = null;
ngOnInit() {
    // 1. Check if we have refreshed this session
    const hasRefreshed = sessionStorage.getItem('bookingsRefreshed');

    if (!hasRefreshed) {
      // 2. If not, set the flag and reload the page
      sessionStorage.setItem('bookingsRefreshed', 'true');
      window.location.reload(); 
    } else {
      // 3. Otherwise, just load your data normally
      this.loadBookings(); 
    }
  }

  trackById(index: number, item: any) {
    return item._id || index;
  }

  // Helper to map service names to icon types
  getServiceIcon(serviceName: string): string {
    const name = (serviceName || '').toLowerCase();
    if (name.includes('ac')) return 'ac';
    if (name.includes('clean')) return 'clean';
    if (name.includes('plumb')) return 'plumb';
    if (name.includes('elec')) return 'elec';
    return 'default';
  }

  loadBookings() {
    this.loading = true;
    this.userService.getMyBookings().subscribe({
      next: (data) => {
        this.bookings = data || [];
        console.log("📦 BOOKINGS LOADED:", this.bookings);
        this.bookings.forEach(b => {
          console.log(`Booking: ${b.serviceName}, Provider: ${b.providerId?.name}`);
        });
        this.loading = false;
      },
      error: (err) => {
        console.error("❌ Error loading bookings:", err);
        this.loading = false;
      }
    });
  }


  // Helper for status badges
  getStatusClass(status: string) {
    switch (status?.toLowerCase()) {
      case 'accepted': return 'status-approved';
      case 'rejected': return 'status-rejected';
      case 'cancelled': return 'status-rejected';
      case 'completed': return 'status-completed';
      default: return 'status-pending';
      
    }
  }

  cancelBooking(id: string) {
    this.userService.cancelBooking(id).subscribe({
      next: () => this.loadBookings(),
      error: err => alert(err.error.message)
    });
  }

payOnline(id: string) {
  this.paymentService.createOrder(id).subscribe((data: any) => {

    this.paymentService.openPayment(data, id, {
      next: () => {
        alert("Payment successful");
        this.loadBookings();
      },
      error: (err: any) => alert(err.error.message)
    });

  });
}
chooseCash(id: string) {
  if (!confirm("Pay at doorstep?")) return;

  this.userService.chooseCashPayment(id).subscribe({
    next: () => {
      alert("Cash payment selected");
      this.loadBookings(); // refresh list
    },
    error: err => alert(err.error.message)
  });
  }

  openReviewModal(booking: any) {
    this.selectedBooking = null;
    this.reviewBooking = booking;
    this.reviewRating = booking?.review?.rating || 0;
    this.reviewResponse = booking?.review?.response || '';
    this.reviewError = '';
    this.reviewLoading = false;
  }

  closeReviewModal() {
    this.reviewBooking = null;
    this.reviewRating = 0;
    this.reviewResponse = '';
    this.reviewError = '';
    this.reviewLoading = false;
  }

  setReviewRating(value: number) {
    this.reviewRating = value;
  }

  formatProviderRating(rating: any): string {
    const value = Number(rating) || 0;
    return value > 0 ? value.toFixed(1) : 'New';
  }

  getRatingTone(rating: any): string {
    const value = Number(rating) || 0;
    if (value <= 0) return 'rating-none';
    if (value < 2.5) return 'rating-low';
    if (value < 4) return 'rating-mid';
    return 'rating-high';
  }

  getRatingFill(rating: any): string {
    const value = Number(rating) || 0;
    if (value <= 0) return '0%';
    if (value < 2.25) return '25%';
    if (value < 3) return '50%';
    if (value <= 4.5) return '75%';
    return '100%';
  }

  submitReview() {
    if (!this.reviewBooking) return;

    if (this.reviewBooking.status !== 'completed') {
      this.reviewError = 'Review is allowed only for completed bookings';
      return;
    }

    if (this.reviewRating < 1 || this.reviewRating > 5) {
      this.reviewError = 'Please select rating from 1 to 5';
      return;
    }

    if (!this.reviewResponse.trim()) {
      this.reviewError = 'Please write your review response';
      return;
    }

    this.reviewLoading = true;
    this.reviewError = '';

    this.userService.submitReview(this.reviewBooking._id, {
      rating: this.reviewRating,
      response: this.reviewResponse.trim()
    }).subscribe({
      next: () => {
        this.reviewLoading = false;
        this.closeReviewModal();
        this.loadBookings();
      },
      error: (err) => {
        this.reviewLoading = false;
        this.reviewError = err?.error?.message || 'Failed to submit review';
      }
    });
  }

}

