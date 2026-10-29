import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../../services/admin.service';

@Component({
  selector: 'app-admin-action-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './action-history.html',
  styleUrl: './action-history.css'
})
export class AdminActionHistoryComponent implements OnInit {
  rows: any[] = [];
  loading = false;
  error = '';
  actionFilter: 'all' | 'provider_rejected' | 'provider_deleted' | 'user_deleted' = 'all';

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory() {
    this.loading = true;
    this.error = '';
    this.adminService.getActionHistory().subscribe({
      next: (res: any[]) => {
        this.rows = Array.isArray(res) ? res : [];
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Failed to load action history';
      }
    });
  }

  toLabel(action: string): string {
    switch (String(action || '').toLowerCase()) {
      case 'provider_rejected':
        return 'Provider Rejected';
      case 'provider_deleted':
        return 'Provider Deleted';
      case 'user_deleted':
        return 'User Deleted';
      default:
        return 'Action';
    }
  }

  get filteredRows(): any[] {
    if (this.actionFilter === 'all') return this.rows;
    return this.rows.filter(row => String(row?.action || '').toLowerCase() === this.actionFilter);
  }

  setFilter(filter: 'all' | 'provider_rejected' | 'provider_deleted' | 'user_deleted') {
    this.actionFilter = filter;
  }

  get totalRowsCount(): number {
    return this.rows.length;
  }

  get providerActionsCount(): number {
    return this.rows.filter(row => String(row?.targetRole || '').toLowerCase() === 'provider').length;
  }

  get userActionsCount(): number {
    return this.rows.filter(row => String(row?.targetRole || '').toLowerCase() === 'user').length;
  }

  get actionFilterLabel(): string {
    if (this.actionFilter === 'provider_rejected') return 'Provider Rejections';
    if (this.actionFilter === 'provider_deleted') return 'Provider Deletions';
    if (this.actionFilter === 'user_deleted') return 'User Deletions';
    return 'All Actions';
  }

  getActionTone(action: string): 'reject' | 'delete' | 'neutral' {
    const normalized = String(action || '').toLowerCase();
    if (normalized === 'provider_rejected') return 'reject';
    if (normalized === 'provider_deleted' || normalized === 'user_deleted') return 'delete';
    return 'neutral';
  }

  trackByRow(index: number, row: any): string {
    return String(row?._id || index);
  }
}
