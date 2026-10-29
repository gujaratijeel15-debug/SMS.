import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProviderService } from '../../../../services/provider';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-provider-requests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './requests.html',
  styleUrls: ['./requests.css']
  
})
export class ProviderRequestsComponent implements OnInit {

    

  requests: any[] = [];
  rejectReason: Record<string, string> = {};
  processingMap: Record<string, boolean> = {};

  constructor(private providerService: ProviderService) {}

  ngOnInit() {
    this.loadRequests();
  }

loadRequests() {
  this.providerService.getPendingBookings()
    .subscribe((res: any) => this.requests = Array.isArray(res) ? res : []);
}

accept(id: string) {
  this.processingMap[id] = true;
  this.providerService.acceptBooking(id)
    .pipe(finalize(() => {
      this.processingMap[id] = false;
    }))
    .subscribe(() => {
      this.loadRequests();
    });
}

reject(id: string) {
  const reason = (this.rejectReason[id] || '').trim();
  if (reason.length < 5) {
    alert('Please provide a valid reason (minimum 5 characters).');
    return;
  }

  this.processingMap[id] = true;
  this.providerService.rejectBooking(id, reason)
    .pipe(finalize(() => {
      this.processingMap[id] = false;
    }))
    .subscribe(() => {
      this.rejectReason[id] = '';
      this.loadRequests();
    });
}

isBusy(id: string): boolean {
  return !!this.processingMap[id];
}

}
