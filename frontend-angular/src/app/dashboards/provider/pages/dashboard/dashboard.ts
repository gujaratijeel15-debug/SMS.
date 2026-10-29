import { AfterViewInit, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProviderService } from 'src/app/services/provider';
import { finalize } from 'rxjs/operators';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-provider-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class ProviderDashboardComponent implements OnInit, AfterViewInit {
  private trendChart: Chart | null = null;
  private statusChart: Chart | null = null;
  private counterIntervals: Partial<Record<keyof typeof this.counter, any>> = {};

  stats: any = {};
  bookings: any[] = [];
  recentBookings: any[] = [];
  isAvailable = false;
  earnings = 0;
  loading = true;

  provider = {
    name: 'Provider',
    email: 'provider@example.com'
  };

  counter = {
    total: 0,
    pending: 0,
    completed: 0,
    cancelled: 0,
    accepted: 0
  };

  constructor(private providerService: ProviderService) {}

  ngOnInit() {
    this.loadProviderData();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.createStatusChart();
      this.createTrendChart();
    }, 300);
  }

  loadProviderData() {
    this.loading = true;

    this.providerService.getProfile().subscribe({
      next: (res: any) => {
        this.provider.name = res?.name || res?.username || 'Provider';
        this.provider.email = res?.email || 'provider@example.com';
      },
      error: () => {
        this.provider = { name: 'Provider', email: 'provider@example.com' };
      }
    });

    this.providerService.getAvailability().subscribe({
      next: (res: any) => {
        this.isAvailable = !!res?.isAvailable;
      },
      error: () => {
        this.isAvailable = false;
      }
    });

    this.providerService.getBookings()
      .pipe(finalize(() => {
        this.loading = false;
      }))
      .subscribe({
        next: (res: any) => {
          this.bookings = Array.isArray(res) ? res : [];
          this.recentBookings = this.bookings.slice(0, 3).map((booking: any) => ({
            serviceName: booking.serviceName || booking.service || 'Service',
            createdAt: booking.createdAt || new Date(),
            status: booking.status || 'pending'
          }));

          this.calculateCountersFromBookings();
          this.createStatusChart();
          this.createTrendChart();
        },
        error: () => {
          this.bookings = [];
          this.recentBookings = [];
          this.calculateCountersFromStatsFallback();
          this.createStatusChart();
          this.createTrendChart();
        }
      });

    this.providerService.getDashboardStats().subscribe({
      next: (res: any) => {
        this.stats = res || {};
        if (!this.bookings.length) {
          this.calculateCountersFromStatsFallback();
          this.createStatusChart();
          this.createTrendChart();
        }
      },
      error: () => {
        this.stats = {};
      }
    });

    this.providerService.getEarnings().subscribe({
      next: (res: any) => {
        this.earnings = Number(res?.totalEarnings || 0);
      },
      error: () => {
        this.earnings = 0;
      }
    });
  }

  private calculateCountersFromBookings() {
    const totalCount = this.bookings.length;
    const pendingCount = this.bookings.filter((b: any) => (b.status || '').toLowerCase() === 'pending').length;
    const completedCount = this.bookings.filter((b: any) => (b.status || '').toLowerCase() === 'completed').length;
    const cancelledCount = this.bookings.filter((b: any) => (b.status || '').toLowerCase() === 'rejected').length;
    const acceptedCount = this.bookings.filter((b: any) => (b.status || '').toLowerCase() === 'accepted').length;

    this.animateCounter('total', totalCount);
    this.animateCounter('pending', pendingCount);
    this.animateCounter('completed', completedCount);
    this.animateCounter('cancelled', cancelledCount);
    this.animateCounter('accepted', acceptedCount);
  }

  private calculateCountersFromStatsFallback() {
    const totalCount = Number(this.stats?.totalRequests || 0);
    const acceptedCount = Number(this.stats?.activeJobs || 0);
    const completedCount = Number(this.stats?.completedJobs || 0);
    const cancelledCount = Number(this.stats?.rejectedJobs || 0);
    const pendingCount = Math.max(totalCount - acceptedCount - completedCount - cancelledCount, 0);

    this.animateCounter('total', totalCount);
    this.animateCounter('pending', pendingCount);
    this.animateCounter('completed', completedCount);
    this.animateCounter('cancelled', cancelledCount);
    this.animateCounter('accepted', acceptedCount);
  }

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
            this.counter.pending,
            this.counter.accepted,
            this.counter.completed,
            this.counter.cancelled
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
      const created = b?.createdAt ? new Date(b.createdAt) : null;
      if (created && !Number.isNaN(created.getTime())) {
        const month = created.getMonth();
        monthly[month]++;
      }
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
          'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
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
        plugins: { legend: { labels: { color: 'white' } } },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { color: 'white' },
            grid: { color: 'rgba(255,255,255,0.08)' }
          },
          x: {
            ticks: { color: 'white' },
            grid: { color: 'rgba(255,255,255,0.04)' }
          }
        }
      }
    });
  }
}
