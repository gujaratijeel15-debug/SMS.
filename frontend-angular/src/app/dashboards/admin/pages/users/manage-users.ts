import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { AdminService } from '../../../../services/admin.service';

@Component({
  selector: 'app-admin-manage-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manage-users.html',
  styleUrl: './manage-users.css'
})
export class AdminManageUsersComponent implements OnInit {
  users: any[] = [];
  search = '';
  deletingMap: Record<string, boolean> = {};
  avatarErrorMap: Record<string, boolean> = {};

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers() {
    this.adminService.getUsers().subscribe((res) => {
      this.users = (res || []).filter(user => user.role === 'user');
    });
  }

  get filteredUsers() {
    const query = this.search.trim().toLowerCase();
    if (!query) return this.users;

    return this.users.filter(user => {
      const name = String(user.name || '').toLowerCase();
      const email = String(user.email || '').toLowerCase();
      const city = String(user.city || '').toLowerCase();
      return name.includes(query) || email.includes(query) || city.includes(query);
    });
  }

  get totalUsersCount(): number {
    return this.users.length;
  }

  get verifiedUsersCount(): number {
    return this.users.filter(user => user?.isVerified).length;
  }

  get unverifiedUsersCount(): number {
    return this.totalUsersCount - this.verifiedUsersCount;
  }

  clearSearch() {
    this.search = '';
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

  getAvatarSrc(user: any): string {
    const userId = String(user?._id || '');
    if (userId && this.avatarErrorMap[userId]) {
      return '';
    }

    const rawAvatar = String(user?.avatar || '').trim();
    if (!rawAvatar) return '';

    if (/^data:image\//i.test(rawAvatar) || /^https?:\/\//i.test(rawAvatar)) {
      return rawAvatar;
    }

    const mime = this.detectImageMime(rawAvatar);
    return `data:${mime};base64,${rawAvatar}`;
  }

  onAvatarError(userId: string) {
    const key = String(userId || '');
    if (!key) return;
    this.avatarErrorMap[key] = true;
  }

  trackByUserId(_index: number, user: any): string {
    return String(user?._id || _index);
  }

  private detectImageMime(base64Value: string): string {
    if (base64Value.startsWith('iVBOR')) return 'image/png';
    if (base64Value.startsWith('/9j/')) return 'image/jpeg';
    if (base64Value.startsWith('R0lGOD')) return 'image/gif';
    if (base64Value.startsWith('UklGR')) return 'image/webp';
    return 'image/jpeg';
  }

  deleteUser(user: any) {
    const reason = prompt(`Enter deletion reason for ${user?.name || 'this user'}:`);
    if (reason === null) return;
    const trimmedReason = String(reason).trim();
    if (trimmedReason.length < 5) {
      alert('Deletion reason must be at least 5 characters');
      return;
    }

    if (!confirm('Delete this user account permanently?')) return;

    const userId = String(user?._id || '');
    if (!userId) return;

    this.deletingMap[userId] = true;
    this.adminService.deleteUser(userId, trimmedReason)
      .pipe(finalize(() => this.deletingMap[userId] = false))
      .subscribe({
        next: (res: any) => {
          alert(res?.message || 'User deleted successfully');
          this.users = this.users.filter(item => item._id !== userId);
        },
        error: (err) => {
          alert(err?.error?.message || 'Failed to delete user');
        }
      });
  }

  isDeleting(userId: string): boolean {
    return !!this.deletingMap[userId];
  }
}
