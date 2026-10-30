import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AdminService {

  private API = 'https://sms-backend-jeel.onrender.com/api/admin';

  constructor(private http: HttpClient) {}

  getProviders() {
    return this.http.get<any[]>(`${this.API}/providers`);
  }

  approveProvider(id: string) {
    return this.http.put(`${this.API}/providers/${id}/approve`, {});
  }

  rejectProvider(id: string) {
    return this.http.put(`${this.API}/providers/${id}/reject`, {});
  }
}
