import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { AdminService } from '../../../../services/admin.service';

@Component({
  selector: 'app-admin-manage-providers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manage-providers.html',
  styleUrl: './manage-providers.css'
})
export class AdminManageProvidersComponent implements OnInit {
  providers: any[] = [];
  search = '';
  processingMap: Record<string, boolean> = {};
  deletingMap: Record<string, boolean> = {};
  avatarErrorMap: Record<string, boolean> = {};

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadProviders();
  }

  loadProviders() {
    this.adminService.getProviders().subscribe((res) => {
      this.providers = Array.isArray(res) ? res : [];
    });
  }

  approve(providerId: string) {
    this.processingMap[providerId] = true;
    this.adminService.approveProvider(providerId)
      .pipe(finalize(() => this.processingMap[providerId] = false))
      .subscribe(() => this.loadProviders());
  }

  reject(provider: any) {
    const reason = prompt(`Enter rejection reason for ${provider?.name || 'this provider'}:`);
    if (reason === null) return;
    const trimmedReason = String(reason).trim();
    if (trimmedReason.length < 5) {
      alert('Valid rejection reason is required (minimum 5 characters)');
      return;
    }

    const providerId = String(provider?._id || '');
    if (!providerId) return;

    this.processingMap[providerId] = true;
    this.adminService.rejectProvider(providerId, trimmedReason)
      .pipe(finalize(() => this.processingMap[providerId] = false))
      .subscribe({
        next: (res: any) => {
          alert(res?.message || 'Provider rejected successfully');
          this.loadProviders();
        },
        error: (err) => {
          alert(err?.error?.message || 'Failed to reject provider');
        }
      });
  }

  toggleAvailability(providerId: string) {
    this.processingMap[providerId] = true;
    this.adminService.toggleProviderAvailability(providerId)
      .pipe(finalize(() => this.processingMap[providerId] = false))
      .subscribe(() => this.loadProviders());
  }

  isBusy(providerId: string): boolean {
    return !!this.processingMap[providerId];
  }

  deleteProvider(provider: any) {
    const reason = prompt(`Enter deletion reason for ${provider?.name || 'this provider'}:`);
    if (reason === null) return;
    const trimmedReason = String(reason).trim();
    if (trimmedReason.length < 5) {
      alert('Deletion reason must be at least 5 characters');
      return;
    }

    if (!confirm('Delete this provider account permanently?')) return;

    const providerId = String(provider?._id || '');
    if (!providerId) return;

    this.deletingMap[providerId] = true;
    this.adminService.deleteProvider(providerId, trimmedReason)
      .pipe(finalize(() => this.deletingMap[providerId] = false))
      .subscribe({
        next: (res: any) => {
          alert(res?.message || 'Provider deleted successfully');
          this.providers = this.providers.filter(item => item._id !== providerId);
        },
        error: (err) => {
          alert(err?.error?.message || 'Failed to delete provider');
        }
      });
  }

  isDeleting(providerId: string): boolean {
    return !!this.deletingMap[providerId];
  }

  clearSearch() {
    this.search = '';
  }

  get totalProvidersCount(): number {
    return this.providers.length;
  }

  get pendingProvidersCount(): number {
    return this.providers.filter(provider => provider?.status === 'pending').length;
  }

  get approvedProvidersCount(): number {
    return this.providers.filter(provider => provider?.status === 'approved').length;
  }

  get availableProvidersCount(): number {
    return this.providers.filter(
      provider => provider?.status === 'approved' && provider?.isAvailable !== false
    ).length;
  }

  getInitials(name: string): string {
    const parts = String(name || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2);

    if (!parts.length) return 'NA';
    return parts.map(part => part[0].toUpperCase()).join('');
  }

  getAvatarSrc(provider: any): string {
    const providerId = String(provider?._id || '');
    if (providerId && this.avatarErrorMap[providerId]) {
      return '';
    }

    const rawAvatar = String(provider?.avatar || '').trim();
    if (!rawAvatar) return '';

    if (/^data:image\//i.test(rawAvatar) || /^https?:\/\//i.test(rawAvatar)) {
      return rawAvatar;
    }

    const mime = this.detectImageMime(rawAvatar);
    return `data:${mime};base64,${rawAvatar}`;
  }

  onAvatarError(providerId: string) {
    const key = String(providerId || '');
    if (!key) return;
    this.avatarErrorMap[key] = true;
  }

  trackByProviderId(index: number, provider: any): string {
    return String(provider?._id || index);
  }

  private matchesSearch(provider: any): boolean {
    const query = this.search.trim().toLowerCase();
    if (!query) return true;

    const name = String(provider.name || '').toLowerCase();
    const email = String(provider.email || '').toLowerCase();
    const service = String(provider.providerService || '').toLowerCase();
    const city = String(provider.city || '').toLowerCase();
    return (
      name.includes(query) ||
      email.includes(query) ||
      service.includes(query) ||
      city.includes(query)
    );
  }

  get filteredPendingProviders() {
    return this.providers.filter(provider =>
      provider.status === 'pending' && this.matchesSearch(provider)
    );
  }

  get filteredApprovedProviders() {
    return this.providers.filter(provider =>
      provider.status === 'approved' && this.matchesSearch(provider)
    );
  }

  private detectImageMime(base64Value: string): string {
    if (base64Value.startsWith('iVBOR')) return 'image/png';
    if (base64Value.startsWith('/9j/')) return 'image/jpeg';
    if (base64Value.startsWith('R0lGOD')) return 'image/gif';
    if (base64Value.startsWith('UklGR')) return 'image/webp';
    return 'image/jpeg';
  }
}
