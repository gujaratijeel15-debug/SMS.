import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { AdminService, AdminStats } from '../../../../services/admin.service';

@Component({
  standalone: true,
  selector: 'app-admin-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'

})
export class AdminDashboardComponent implements OnInit {
  loading = true;

  stats: AdminStats = {
    users: 0,
    providers: 0,
    bookings: 0,
    pendingProviders: 0,
    messages: 0,
    openMessages: 0,
    reviews: 0
  };

  recentMessages: any[] = [];
  recentReviews: any[] = [];

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.loadDashboard();
  }

  loadDashboard() {
    this.loading = true;
    forkJoin({
      stats: this.adminService.getStats(),
      messages: this.adminService.getMessages(''),
      reviews: this.adminService.getReviews()
    }).subscribe({
      next: ({ stats, messages, reviews }) => {
        this.stats = stats;
        this.recentMessages = (messages || []).slice(0, 4);
        this.recentReviews = (reviews || []).slice(0, 4);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  percent(value: number, total: number): number {
    if (!total) return 0;
    return Math.round((value / total) * 100);
  }

  get userShare(): number {
    const total = this.stats.users + this.stats.providers;
    return this.percent(this.stats.users, total);
  }

  get providerShare(): number {
    return 100 - this.userShare;
  }

  get resolvedMessageShare(): number {
    return this.percent(this.resolvedMessages, this.stats.messages);
  }

  get resolvedMessages(): number {
    return Math.max(0, this.stats.messages - this.stats.openMessages);
  }

  get audienceDonutStyle() {
    return {
      background: `conic-gradient(#22c55e 0 ${this.userShare}%, #ffffff ${this.userShare}% 100%)`
    };
  }

  get supportDonutStyle() {
    const resolved = this.resolvedMessageShare;
    return {
      background: `conic-gradient(#22c55e 0 ${resolved}%, #2a2a2a ${resolved}% 100%)`
    };
  }

  get workloadBars() {
    return [
      { label: 'Users', value: this.stats.users, tone: 'green' },
      { label: 'Providers', value: this.stats.providers, tone: 'white' },
      { label: 'Bookings', value: this.stats.bookings, tone: 'green' },
      { label: 'Reviews', value: this.stats.reviews, tone: 'white' }
    ];
  }

  get maxBarValue(): number {
    return Math.max(1, ...this.workloadBars.map(item => item.value || 0));
  }

  barHeight(value: number): string {
    const scaled = Math.round((value / this.maxBarValue) * 100);
    return `${Math.max(10, scaled)}%`;
  }

  get providerApprovalPercent(): number {
    const approved = Math.max(0, this.stats.providers - this.stats.pendingProviders);
    return this.percent(approved, this.stats.providers);
  }

  get reviewCoveragePercent(): number {
    return this.percent(this.stats.reviews, this.stats.bookings);
  }
}
