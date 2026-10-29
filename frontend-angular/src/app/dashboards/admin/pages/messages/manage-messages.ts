import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { AdminService } from '../../../../services/admin.service';

@Component({
  selector: 'app-admin-manage-messages',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manage-messages.html',
  styleUrl: './manage-messages.css'
})
export class AdminManageMessagesComponent implements OnInit {
  messages: any[] = [];
  statusFilter: '' | 'open' | 'resolved' = '';
  processingMap: Record<string, boolean> = {};
  replyDraftMap: Record<string, string> = {};
  feedbackMap: Record<string, string> = {};

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadMessages();
  }

  loadMessages() {
    this.adminService.getMessages(this.statusFilter).subscribe((res) => {
      this.messages = Array.isArray(res) ? res : [];
    });
  }

  setFilter(filter: '' | 'open' | 'resolved') {
    this.statusFilter = filter;
    this.loadMessages();
  }

  setStatus(messageId: string, status: 'open' | 'resolved') {
    this.processingMap[messageId] = true;
    this.adminService.updateMessageStatus(messageId, status)
      .pipe(finalize(() => this.processingMap[messageId] = false))
      .subscribe(() => this.loadMessages());
  }

  markResolved(message: any) {
    const messageId = String(message?._id || '');
    if (!messageId || this.isBusy(messageId)) return;

    if (!confirm('Mark this message as resolved?')) return;

    this.processingMap[messageId] = true;
    this.feedbackMap[messageId] = '';

    this.adminService.updateMessageStatus(messageId, 'resolved')
      .pipe(finalize(() => this.processingMap[messageId] = false))
      .subscribe({
        next: () => {
          this.feedbackMap[messageId] = 'Marked as resolved.';
          this.messages = this.messages
            .map(item => item._id === messageId ? { ...item, status: 'resolved' } : item)
            .filter(item => this.statusFilter !== 'open' || item.status !== 'resolved');
        },
        error: (err) => {
          this.feedbackMap[messageId] = err?.error?.message || 'Failed to mark as resolved.';
        }
      });
  }

  isBusy(messageId: string): boolean {
    return !!this.processingMap[messageId];
  }

  sendReply(messageId: string) {
    const reply = String(this.replyDraftMap[messageId] || '').trim();
    if (reply.length < 5) {
      this.feedbackMap[messageId] = 'Reply must be at least 5 characters.';
      return;
    }

    this.processingMap[messageId] = true;
    this.feedbackMap[messageId] = '';

    this.adminService.sendMessageReply(messageId, reply)
      .pipe(finalize(() => this.processingMap[messageId] = false))
      .subscribe({
        next: () => {
          this.feedbackMap[messageId] = 'Email sent successfully.';
          this.replyDraftMap[messageId] = '';
          this.loadMessages();
        },
        error: (err) => {
          this.feedbackMap[messageId] = err?.error?.message || 'Failed to send email.';
        }
      });
  }

  get totalMessagesCount(): number {
    return this.messages.length;
  }

  get openMessagesCount(): number {
    return this.messages.filter(msg => msg?.status !== 'resolved').length;
  }

  get resolvedMessagesCount(): number {
    return this.messages.filter(msg => msg?.status === 'resolved').length;
  }

  get filterLabel(): string {
    if (this.statusFilter === 'open') return 'Open Only';
    if (this.statusFilter === 'resolved') return 'Resolved Only';
    return 'All Messages';
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

  trackByMessage(index: number, message: any): string {
    return String(message?._id || index);
  }
}
