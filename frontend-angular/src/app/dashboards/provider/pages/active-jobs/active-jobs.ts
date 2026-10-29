import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProviderService } from '../../../../services/provider';

@Component({
  selector: 'app-provider-active-jobs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './active-jobs.html',
  styleUrls: ['./active-jobs.css']
})
export class ProviderActiveJobsComponent implements OnInit {

  jobs: any[] = [];
  isRefreshing = false;

  constructor(private providerService: ProviderService) {}

  ngOnInit() {
    this.refreshPageData();
  }

  refreshPageData() {
    this.isRefreshing = true;
    this.providerService.getActiveJobs()
      .subscribe({
        next: (res: any) => {
          this.jobs = Array.isArray(res) ? res : [];
          this.isRefreshing = false;
        },
        error: () => {
          this.isRefreshing = false;
        }
      });
  }

  get paidJobsCount(): number {
    return this.jobs.filter(job => job.paymentStatus === 'paid').length;
  }

  get pendingPaymentCount(): number {
    return this.jobs.filter(job => job.paymentStatus !== 'paid').length;
  }

  completeJob(job: any) {
    this.providerService.completeBooking(job._id)
      .subscribe(() => {
        this.refreshPageData();
      });
  }

  markPaid(id: string) {
    if (!confirm('Confirm payment received?')) return;

    this.providerService.markPaymentPaid(id).subscribe({
      next: () => {
        alert('Payment marked as received');
        // Local update for instant button state change
        this.jobs = this.jobs.map(job =>
          job._id === id ? { ...job, paymentStatus: 'paid' } : job
        );
        // Sync from backend without reloading whole website
        this.refreshPageData();
      },
      error: err => alert(err.error.message)
    });
  }

  getCustomerName(job: any): string {
    if (!job) return 'N/A';
    if (job.userId && typeof job.userId === 'object') {
      return job.userId.name || 'N/A';
    }
    return 'N/A';
  }
}
