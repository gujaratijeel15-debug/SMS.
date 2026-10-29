import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../../services/user';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css']
})
export class ProfileComponent implements OnInit {

  profile: any = {};
  editMode = false;
  loading = false;

  // Modern placeholders
  defaultAvatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix';
  defaultCover = 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1974&auto=format&fit=crop';

  private platformId = inject(PLATFORM_ID);

  constructor(private userService: UserService) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadProfile();
    }
  }

  loadProfile() {
    this.userService.getProfile().subscribe({
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

  // 📸 Handle Image Selection (Convert to Base64)
  // This matches the (change)="onFileSelected(...)" in the HTML
  onFileSelected(event: any, field: 'avatar' | 'cover') {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      // Assign the Base64 string directly to the profile object
      this.profile[field] = reader.result; 
    };
    reader.readAsDataURL(file);
  }

  save() {
    const phone = String(this.profile.phone || '').trim();
    if (!/^\d{10}$/.test(phone)) {
      alert('Phone number must be exactly 10 digits.');
      return;
    }

    this.loading = true;

    // 🔥 PREPARE PAYLOAD
    // We explicitly include avatar and cover here so they get saved to DB
    const updatePayload = {
      name: this.profile.name,
      city: this.profile.city || '',
      address: this.profile.address || '',
      about: this.profile.about,
      phone,
      avatar: this.profile.avatar, // Send the Base64 string
      cover: this.profile.cover    // Send the Base64 string
    };

    this.userService.updateProfile(updatePayload).subscribe({
      next: () => {
        this.loading = false;
        this.editMode = false;
        alert('Profile saved successfully!');
      },
      error: (err) => {
        this.loading = false;
        console.error('Save Error:', err);
        alert(err?.error?.message || 'Failed to update profile. (Check image size)');
      }
    });
  }

  toggleEdit() {
    this.editMode = !this.editMode;
  }
}
