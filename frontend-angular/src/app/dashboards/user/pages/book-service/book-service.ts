import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpHeaders } from '@angular/common/http';

interface BookableService {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  price?: number;
  image?: string;
  status?: string;
  deactivationReason?: string;
}

@Component({
  selector: 'app-book-service',
  templateUrl: './book-service.html',
  styleUrls: ['./book-service.css'],
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule]
})
export class BookServiceComponent implements OnInit {


  isLoggedIn = false;
  private readonly serviceImages: Record<string, string> = {
    'home cleaning': 'assets/auth/home-2.jpg',
    plumbing: 'assets/auth/plumbing-2.jpg',
    electrical: 'assets/auth/electric.png',
    'appliance repair': 'assets/auth/appliance.png'
  };

  services: BookableService[] = [];

  selectedService: any = null;
  providers: any[] = [];
  selectedProvider: any = null;
  isLoading = false;
  loadingProviders = false;

  errorMessage = '';
  successMessage = '';
  providerMessage = '';

  constructor(private http: HttpClient, private router: Router) {}

ngOnInit() {
  const token = localStorage.getItem('token');
  this.isLoggedIn = !!token;
  this.loadServices();
}

  loadServices() {
    this.http.get<BookableService[]>('https://sms-backend-jeel.onrender.com/api/services').subscribe({
      next: (res) => {
        const rows = Array.isArray(res) ? res : [];
        this.services = rows.map(service => {
          const key = String(service?.name || '').trim().toLowerCase();
          return {
            ...service,
            image: service?.image || this.serviceImages[key] || 'assets/auth/home-2.jpg'
          };
        });
      },
      error: () => {
        this.services = [];
      }
    });
  }


  // select service card
  selectService(service: any) {
    if (this.isServiceInactive(service)) {
      this.errorMessage = this.getServiceDeactivationReason(service);
      return;
    }

    this.errorMessage = '';
    this.selectedService = service;
    this.selectedProvider = null;
    this.loadProvidersForService(service.name);
  }

  isServiceInactive(service: BookableService): boolean {
    return String(service?.status || 'active').toLowerCase() === 'inactive';
  }

  getServiceDeactivationReason(service: BookableService): string {
    const reason = String(service?.deactivationReason || '').trim();
    return reason || 'This service is deactivated by admin for maintenance and policy review.';
  }

  loadProvidersForService(serviceName: string) {
    const token = localStorage.getItem('token');
    if (!token) return;

    this.loadingProviders = true;
    this.providers = [];
    this.providerMessage = '';

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    this.http.get<any>(
      `https://sms-backend-jeel.onrender.com/api/bookings/providers/by-service/${encodeURIComponent(serviceName)}`,
      { headers }
    ).subscribe({
      next: (res) => {
        this.loadingProviders = false;
        const providers = Array.isArray(res) ? res : (res?.providers || []);
        this.providers = providers;
        if (!this.providers.length) {
          this.providerMessage = res?.message || 'Provider not available in your area!';
        }
      },
      error: (err) => {
        this.loadingProviders = false;
        this.providers = [];
        this.providerMessage = err?.error?.message || 'Failed to load providers';
      }
    });
  }

  selectProvider(provider: any) {
    this.selectedProvider = provider;
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

confirmBooking() {
  // Validate user is logged in
  if (!this.isLoggedIn) {
    this.router.navigate(['/auth/login']);
    return;
  }

  // Validate service selection
  if (!this.selectedService) {
    this.errorMessage = 'Please select a service';
    return;
  }

  if (!this.selectedProvider) {
    this.errorMessage = 'Please choose a provider';
    return;
  }

  const selectedServiceId = String(this.selectedService?._id || this.selectedService?.id || '').trim();
  if (!selectedServiceId) {
    this.errorMessage = 'Valid serviceId is required. Please reselect the service and try again.';
    return;
  }
  const servicePrice = Number(this.selectedService?.price);
  if (!Number.isFinite(servicePrice) || servicePrice < 0) {
    this.errorMessage = 'Invalid service price. Please choose another service.';
    return;
  }

  // Reset messages and start loading
  this.isLoading = true;
  this.errorMessage = '';
  this.successMessage = '';

  // Prepare booking data
  const bookingData = {
    serviceId: selectedServiceId,
    serviceName: this.selectedService.name,
    price: servicePrice,
    providerId: this.selectedProvider._id
  };
const token = localStorage.getItem('token');

if (!token) {
  this.router.navigate(['/auth/login']);
  return;
}

const headers = new HttpHeaders({
  Authorization: `Bearer ${token}`
});

this.http.post(
  'https://sms-backend-jeel.onrender.com/api/bookings',
  bookingData,
  { headers }
).subscribe({
  next: () => {
    this.isLoading = false;
    this.successMessage = 'Booking Request Sent! Finding provider...';

    setTimeout(() => {
      this.router.navigate(['/user/bookings']);
    }, 2000);
  },
  error: (err) => {
    this.isLoading = false;
    this.errorMessage = err?.error?.message || 'Booking failed';
    console.log("Full error:", err);
  }
});
}


}
