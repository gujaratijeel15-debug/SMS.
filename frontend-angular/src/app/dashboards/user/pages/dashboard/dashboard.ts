// DEBUG VERSION: dashboard.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserService } from '../../../../services/user';
import { SessionService } from '../../../../services/session.service';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { FooterComponent } from '../../../../components/footer/footer';
import { AfterViewInit } from '@angular/core';
import Chart from 'chart.js/auto';




@Component({
selector: 'app-dashboard',
  standalone: true, // If this is true...
imports: [CommonModule, FooterComponent, RouterModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class UserDashboardComponent implements OnInit, AfterViewInit {
  private trendChart: Chart | null = null;
  private statusChart: Chart | null = null;
  private counterIntervals: Partial<Record<keyof typeof this.counter, any>> = {};

  bookings: any[] = [];
  profile: any = { name: 'User' };
  loading = true;
  now = new Date();

  // User Data
  user = {
    name: 'User',
    email: 'user@example.com',
    initials: 'U'
  };

  // Recent Activity List
  recentBookings: any[] = [];

  // animated counters
  totalCount = 0;
  pendingCount = 0;
  completedCount = 0;
  cancelledCount = 0;
  acceptedCount = 0; // active services

  counter = {
    total: 0,
    pending: 0,
    completed: 0,
    cancelled: 0,
    accepted: 0
  };

  constructor(
    private userService: UserService,
    private session: SessionService
  ) {}

  
  ngOnInit(): void {
    // Get user data from LocalStorage (saved during Login)
    const storedUser = localStorage.getItem('user');
    
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      this.user.name = parsedUser.name || parsedUser.username || 'User';
      this.user.email = parsedUser.email || 'user@example.com';
      
      // Create initials from name (e.g., "John Doe" -> "JD")
      this.user.initials = this.user.name
        .split(' ')
        .map((n: any) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    }

    // Load dashboard data
    this.loadDashboard();
  }

  ngAfterViewInit(): void {
    // wait a moment so the canvas element renders
    setTimeout(() => {
      this.createStatusChart();
      this.createTrendChart();
    }, 300);
  }

  

  private loadDashboard() {
    this.loading = true;

    forkJoin({
      profile: this.userService.getProfile().pipe(
        catchError(err => {
          console.error('API Error: Profile', err);
          return of({ name: this.user.name });
        })
      ),
      bookings: this.userService.getMyBookings().pipe(
        catchError(err => {
          console.error('API Error: Bookings', err);
          return of([]);
        })
      )
    })
    .pipe(
      finalize(() => {
        this.loading = false;
      })
    )
    .subscribe({
      next: (data) => {
        this.profile = data.profile || { name: this.user.name };
        this.bookings = data.bookings || [];
        
        // Update recent bookings (last 3)
        this.recentBookings = this.bookings.slice(0, 3).map((booking: any) => ({
          serviceName: booking.serviceName || booking.service || 'Service',
          createdAt: booking.createdAt || new Date(),
          status: booking.status || 'pending'
        }));
        
        console.log('Dashboard Bookings:', this.bookings);
        console.log('Recent Bookings:', this.recentBookings);
        // calculate all counters
        this.totalCount = this.bookings.length;
        this.pendingCount = this.bookings.filter(b => (b.status||'').toLowerCase() === 'pending').length;
        this.completedCount = this.bookings.filter(b => (b.status||'').toLowerCase() === 'completed').length;
        this.cancelledCount = this.bookings.filter(b => (b.status||'').toLowerCase() === 'rejected').length;
        this.acceptedCount = this.bookings.filter(b => (b.status||'').toLowerCase() === 'accepted').length;

        // animate numbers
        this.animateCounter('total', this.totalCount);
        this.animateCounter('pending', this.pendingCount);
        this.animateCounter('completed', this.completedCount);
        this.animateCounter('cancelled', this.cancelledCount);
        this.animateCounter('accepted', this.acceptedCount);
        this.createStatusChart();
        this.createTrendChart();
      }
    });
  }

  
  private formatDate(date: any): string {
    if (!date) return 'Unknown';
    const bookingDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (bookingDate.toDateString() === today.toDateString()) return 'Today';
    if (bookingDate.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return bookingDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  getGreeting() { return 'Hello'; }

  // (keep getters for backwards compatibility if anyone still used them)
  get activeCount() { return this.bookings.filter((b: any) => b.status === 'active' || b.status === 'in-progress').length; }

  /* helper methods for counters & charts */
  animateCounter(key: keyof typeof this.counter, target: number) {
    if (this.counterIntervals[key]) {
      clearInterval(this.counterIntervals[key]);
      this.counterIntervals[key] = null;
    }

    if (target <= 0) {
      this.counter[key] = 0;
      return;
    }

    let start = 0;
    const speed = 20;
    const interval = setInterval(() => {
      start++;
      this.counter[key] = start;
      if (start >= target) {
        clearInterval(interval);
        this.counterIntervals[key] = null;
      }
    }, speed);
    this.counterIntervals[key] = interval;
  }

  getStatusShare(value: number): number {
    if (!this.counter.total) return 0;
    return Math.round((value / this.counter.total) * 100);
  }

  createStatusChart() {
    const ctx: any = document.getElementById('statusChart');
    if (!ctx) return;

    if (this.statusChart) {
      this.statusChart.destroy();
    }

    this.statusChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Pending', 'Accepted', 'Completed', 'Cancelled'],
        datasets: [{
          data: [
            this.pendingCount,
            this.acceptedCount,
            this.completedCount,
            this.cancelledCount
          ],
          backgroundColor: [
            '#f59e0b',
            '#22c55e',
            '#16a34a',
            '#ef4444'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: 'white' } } }
      }
    });
  }

  createTrendChart() {
    const monthly = new Array(12).fill(0);
    this.bookings.forEach((b: any) => {
      const month = new Date(b.createdAt).getMonth();
      monthly[month]++;
    });
    const ctx: any = document.getElementById('trendChart');
    if (!ctx) return;

    if (this.trendChart) {
      this.trendChart.destroy();
    }

    this.trendChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [
          'Jan','Feb','Mar','Apr','May','Jun',
          'Jul','Aug','Sep','Oct','Nov','Dec'
        ],
        datasets: [{
          label: 'Bookings',
          data: monthly,
          borderColor: '#22c55e',
          tension: .4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins:{ legend:{ labels:{ color:'white'} } },
        scales:{
          y:{
            beginAtZero:true,
            ticks:{ color:'white' },
            grid:{ color:'rgba(255,255,255,0.08)' }
          },
          x:{
            ticks:{ color:'white' },
            grid:{ color:'rgba(255,255,255,0.04)' }
          }
        }
      }
    });
  }
}

