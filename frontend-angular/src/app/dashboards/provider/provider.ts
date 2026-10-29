import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ProviderService } from '../../services/provider';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-provider',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './provider.html',
  styleUrls: ['./provider.css']
})
export class ProviderComponent implements OnInit {

  bookings: any[] = [];

  constructor(
    private providerService: ProviderService,
    private cd: ChangeDetectorRef
  ) {}



  loadBookings() {
    this.providerService.getBookings().subscribe({
      next: (data) => {
        console.log('ANGULAR RECEIVED BOOKINGS:', data);
        this.bookings = data;
        this.cd.detectChanges();   // 👈 THIS LINE FIXES YOUR UI
      },
      error: (err) => console.error(err)
    });
  }

  accept(id: string) {
    this.providerService.acceptBooking(id).subscribe(() => {
      this.loadBookings();
    });
  }

  reject(id: string, reason: string) {
    this.providerService.rejectBooking(id, reason).subscribe(() => {
      this.loadBookings();
    });
  }
isAvailable = true;

ngOnInit() {
  this.loadBookings();
  this.loadAvailability();
}

loadAvailability() {
  this.providerService.getAvailability().subscribe(res => {
    this.isAvailable = res.isAvailable;
  });
}

toggleAvailability() {
  this.providerService.toggleAvailability().subscribe(res => {
    this.isAvailable = res.isAvailable;
  });
}

// provider profile
// provider profile methods moved to ProviderService



}
