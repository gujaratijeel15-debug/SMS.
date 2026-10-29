import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ProviderService } from '../../../../services/provider';


@Component({
  selector: 'app-provider-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css'] // use SAME css as user profile
})
export class ProviderProfileComponent implements OnInit {

isAvailable = false;
  providerServices = [
    'Home Cleaning',
    'Plumbing',
    'Electrical',
    'Appliance Repair'
  ];

  profile: any = {};
  editMode = false;
  loading = false;

  defaultAvatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix';
  defaultCover = 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1974&auto=format&fit=crop';

  private platformId = inject(PLATFORM_ID);

  constructor(
    private providerService: ProviderService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadProviderServices();
      this.loadProfile();
      this.loadAvailability();
    }
  }

  loadProviderServices() {
    this.http.get<any[]>('http://localhost:5000/api/services').subscribe({
      next: (res) => {
        const names = (Array.isArray(res) ? res : [])
          .map(item => String(item?.name || '').trim())
          .filter(Boolean);

        if (names.length > 0) {
          this.providerServices = Array.from(new Set(names));
        }
      }
    });
  }

  loadProfile() {
    this.providerService.getProfile().subscribe({
      next: data => this.profile = data || {},
      error: () => this.profile = {}
    });
  }

  sanitizePhoneInput(value: any): string {
    return String(value || '').replace(/\D/g, '').slice(0, 10);
  }

  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const cleaned = this.sanitizePhoneInput(input?.value);
    if (input && input.value !== cleaned) input.value = cleaned;
    this.profile.phone = cleaned;
  }

  allowOnlyDigits(event: KeyboardEvent): void {
    const key = event.key;
    if (!/^\d$/.test(key)) {
      event.preventDefault();
    }
  }

  onPhonePaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text') || '';
    const cleaned = this.sanitizePhoneInput(pasted);
    this.profile.phone = cleaned;
  }

  // image upload
  onFileSelected(event: any, field: 'avatar' | 'cover') {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      this.profile[field] = reader.result;
    };
    reader.readAsDataURL(file);
  }

  save() {
    if (!this.profile.providerService) {
      alert('Please select your service before saving profile.');
      return;
    }
    const phone = String(this.profile.phone || '').trim();
    if (!/^\d{10}$/.test(phone)) {
      alert('Phone number must be exactly 10 digits.');
      return;
    }

    this.loading = true;

    const updatePayload = {
      name: this.profile.name,
      about: this.profile.about,
      phone,
      avatar: this.profile.avatar,
      cover: this.profile.cover,
      providerService: this.profile.providerService
    };

    this.providerService.updateProfile(updatePayload).subscribe({
      next: (updated: any) => {
        // Keep current rating fields because update-profile API may not include them.
        this.profile = { ...this.profile, ...(updated || {}) };

        // Keep local storage payload small and resilient.
        try {
          const existingRaw = localStorage.getItem('user') || '{}';
          const existingUser = JSON.parse(existingRaw);
          const safeUser = {
            ...existingUser,
            _id: this.profile?._id || existingUser?._id,
            name: this.profile?.name || existingUser?.name,
            email: this.profile?.email || existingUser?.email,
            role: this.profile?.role || existingUser?.role,
            providerService: this.profile?.providerService || existingUser?.providerService
          };
          localStorage.setItem('user', JSON.stringify(safeUser));
        } catch (storageError) {
          console.warn('User cache update skipped:', storageError);
        }

        this.loading = false;
        this.editMode = false;
        alert('Profile saved successfully!');
      },
      error: (err) => {
        this.loading = false;
        console.error(err);
        alert(err?.error?.message || 'Failed to update profile');
      }
    });
  }

  toggleEdit() {
    this.editMode = !this.editMode;
  }

  loadAvailability() {
    this.providerService.getAvailability()
      .subscribe((res: any) => {
        this.isAvailable = res?.isAvailable !== false;
      });
  }

  toggleAvailability() {
    this.providerService.toggleAvailability()
      .subscribe((res: any) => {
        this.isAvailable = res.isAvailable;
      });
  }

  getRatingTone(rating: any): string {
    const value = Number(rating) || 0;
    if (value <= 0) return 'rating-none';
    if (value < 2.5) return 'rating-low';
    if (value < 4) return 'rating-mid';
    return 'rating-high';
  }

  getRatingFill(rating: any): string {
    const value = Number(rating) || 0;
    if (value <= 0) return '0%';
    if (value < 2.25) return '25%';
    if (value < 3) return '50%';
    if (value <= 4.5) return '75%';
    return '100%';
  }
}
