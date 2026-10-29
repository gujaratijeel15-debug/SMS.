import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../../services/admin.service';

@Component({
  selector: 'app-admin-provider-reviews',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './provider-reviews.html',
  styleUrl: './provider-reviews.css'
})
export class AdminProviderReviewsComponent implements OnInit {
  reviews: any[] = [];
  selectedRating: 'all' | 'low' | 'mid' | 'high' = 'all';

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.adminService.getReviews().subscribe((res) => {
      this.reviews = Array.isArray(res) ? res : [];
    });
  }

  get filteredReviews(): any[] {
    if (this.selectedRating === 'all') return this.reviews;

    return this.reviews.filter(item => {
      const rating = this.getRatingValue(item?.review?.rating);
      if (this.selectedRating === 'high') return rating >= 4;
      if (this.selectedRating === 'mid') return rating === 3;
      return rating <= 2;
    });
  }

  get totalReviewsCount(): number {
    return this.reviews.length;
  }

  get averageRating(): number {
    if (!this.reviews.length) return 0;
    const total = this.reviews.reduce((sum, item) => sum + this.getRatingValue(item?.review?.rating), 0);
    return Number((total / this.reviews.length).toFixed(1));
  }

  get lowRatingCount(): number {
    return this.reviews.filter(item => this.getRatingValue(item?.review?.rating) <= 2).length;
  }

  get highRatingCount(): number {
    return this.reviews.filter(item => this.getRatingValue(item?.review?.rating) >= 4).length;
  }

  setRatingFilter(filter: 'all' | 'low' | 'mid' | 'high') {
    this.selectedRating = filter;
  }

  getRatingValue(rating: number): number {
    return Math.max(1, Math.min(5, Number(rating) || 0));
  }

  getStars(rating: number): string {
    const safeRating = this.getRatingValue(rating);
    return '\u2605'.repeat(safeRating) + '\u2606'.repeat(5 - safeRating);
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

  trackByReview(index: number, item: any): string {
    return String(item?._id || item?.id || index);
  }
}
