import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { AdminService, AppService } from '../../../../services/admin.service';

@Component({
  selector: 'app-admin-manage-services',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manage-services.html',
  styleUrl: './manage-services.css'
})
export class AdminManageServicesComponent implements OnInit {
  services: AppService[] = [];
  readonly fallbackServiceImage = 'assets/auth/home-2.jpg';
  readonly defaultDeactivationReason = 'Temporarily unavailable due to quality checks and operational updates.';

  form = {
    name: '',
    description: '',
    price: null as number | null,
    image: ''
  };

  loading = false;
  creating = false;
  updating = false;
  editingServiceId: string | null = null;
  deletingMap: Record<string, boolean> = {};
  statusUpdatingMap: Record<string, boolean> = {};
  success = '';
  error = '';

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadServices();
  }

  loadServices() {
    this.loading = true;
    this.adminService.getServices()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (res) => {
          this.services = Array.isArray(res) ? res : [];
        },
        error: (err) => {
          this.error = err?.error?.message || 'Failed to load services';
        }
      });
  }

  addService() {
    const name = this.form.name.trim();
    if (!name) {
      this.error = 'Service name is required';
      return;
    }
    const normalizedName = name.toLowerCase();
    const duplicateExists = this.services.some(
      service => String(service?.name || '').trim().toLowerCase() === normalizedName
    );
    if (duplicateExists) {
      this.error = 'Service name already exists';
      return;
    }
    const price = Number(this.form.price);
    if (!Number.isFinite(price) || price < 0) {
      this.error = 'Add a valid price (0 or more)';
      return;
    }
    const payload: {
      name: string;
      description?: string;
      price?: number;
      image?: string;
      status: string;
    } = {
      name,
      status: 'active'
    };

    if (this.form.description.trim()) {
      payload.description = this.form.description.trim();
    }

    if (Number.isFinite(price) && price >= 0) {
      payload.price = price;
    }

    if (this.form.image.trim()) {
      payload.image = this.form.image.trim();
    }

    this.creating = true;
    this.error = '';
    this.success = '';

    this.adminService.createService(payload)
      .pipe(finalize(() => this.creating = false))
      .subscribe({
        next: () => {
          this.success = 'Service added successfully';
          this.resetForm();
          this.loadServices();
        },
        error: (err) => {
          this.error = err?.error?.message || 'Failed to add service';
        }
      });
  }

  startEdit(service: AppService) {
    this.editingServiceId = service._id;
    this.form = {
      name: service.name || '',
      description: service.description || '',
      price: service.price ?? null,
      image: service.image || ''
    };
    this.error = '';
    this.success = '';
  }

  updateService() {
    if (!this.editingServiceId) return;

    const name = this.form.name.trim();
    if (!name) {
      this.error = 'Service name is required';
      return;
    }
    const price = Number(this.form.price);
    if (!Number.isFinite(price) || price < 0) {
      this.error = 'Add a valid price (0 or more)';
      return;
    }

    const payload: {
      name: string;
      description?: string;
      price?: number;
      image?: string;
      status: string;
    } = {
      name,
      status: 'active'
    };

    if (this.form.description.trim()) {
      payload.description = this.form.description.trim();
    }

    if (Number.isFinite(price) && price >= 0) {
      payload.price = price;
    }

    if (this.form.image.trim()) {
      payload.image = this.form.image.trim();
    }

    this.updating = true;
    this.error = '';
    this.success = '';

    this.adminService.updateService(this.editingServiceId, payload)
      .pipe(finalize(() => this.updating = false))
      .subscribe({
        next: () => {
          this.success = 'Service updated successfully';
          this.resetForm();
          this.loadServices();
        },
        error: (err) => {
          this.error = err?.error?.message || 'Failed to update service';
        }
      });
  }

  cancelEdit() {
    this.resetForm();
    this.error = '';
    this.success = '';
  }

  deleteService(serviceId: string) {
    const confirmed = window.confirm('Are you sure you want to delete this service?');
    if (!confirmed) {
      return;
    }

    this.deletingMap[serviceId] = true;
    this.error = '';
    this.success = '';

    this.adminService.deleteService(serviceId)
      .pipe(finalize(() => this.deletingMap[serviceId] = false))
      .subscribe({
        next: () => {
          this.success = 'Service deleted successfully';
          this.services = this.services.filter(service => service._id !== serviceId);
        },
        error: (err) => {
          this.error = err?.error?.message || 'Failed to delete service';
        }
      });
  }

  isDeleting(serviceId: string): boolean {
    return !!this.deletingMap[serviceId];
  }

  toggleServiceStatus(service: AppService) {
    const serviceId = String(service?._id || '');
    if (!serviceId) return;

    const currentStatus = String(service?.status || 'active').toLowerCase();
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';

    this.statusUpdatingMap[serviceId] = true;
    this.error = '';
    this.success = '';

    this.adminService.updateService(serviceId, {
      status: nextStatus,
      deactivationReason: nextStatus === 'inactive' ? this.defaultDeactivationReason : ''
    })
      .pipe(finalize(() => this.statusUpdatingMap[serviceId] = false))
      .subscribe({
        next: () => {
          this.success = `Service ${nextStatus === 'active' ? 'activated' : 'deactivated'} successfully`;
          this.services = this.services.map(item =>
            item._id === serviceId
              ? {
                  ...item,
                  status: nextStatus,
                  deactivationReason: nextStatus === 'inactive' ? this.defaultDeactivationReason : ''
                }
              : item
          );
        },
        error: (err) => {
          this.error = err?.error?.message || 'Failed to update service status';
        }
      });
  }

  isStatusUpdating(serviceId: string): boolean {
    return !!this.statusUpdatingMap[serviceId];
  }

  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      this.form.image = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  }

  get totalServicesCount(): number {
    return this.services.length;
  }

  get activeServicesCount(): number {
    return this.services.filter(service => String(service?.status || 'active') === 'active').length;
  }

  get servicesWithPriceCount(): number {
    return this.services.filter(service => service?.price !== undefined && service?.price !== null).length;
  }

  get editingModeLabel(): string {
    return this.editingServiceId ? 'Editing Service' : 'Create Mode';
  }

  trackByServiceId(index: number, service: AppService): string {
    return String(service?._id || index);
  }

  getServiceImage(service: AppService): string {
    const image = String(service?.image || '').trim();
    return image || this.fallbackServiceImage;
  }

  private resetForm() {
    this.editingServiceId = null;
    this.form = { name: '', description: '', price: null, image: '' };
  }
}
