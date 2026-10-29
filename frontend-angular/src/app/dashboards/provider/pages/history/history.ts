import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProviderService } from '../../../../services/provider';

@Component({
  selector: 'app-provider-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './history.html',
  styleUrls: ['./history.css']
})
export class ProviderHistoryComponent implements OnInit {

  history: any[] = [];

  constructor(private providerService: ProviderService) {}

  ngOnInit() {
    this.loadHistory();
  }

  loadHistory() {
    this.providerService.getJobHistory()
      .subscribe((res: any) => this.history = res);
  }

  getCustomerName(job: any): string {
    if (!job) return 'N/A';
    if (job.userId && typeof job.userId === 'object') {
      return job.userId.name || 'N/A';
    }
    return 'N/A';
  }
}
