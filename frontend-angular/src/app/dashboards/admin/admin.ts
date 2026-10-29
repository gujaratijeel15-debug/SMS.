import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../services/admin';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.html',
  styleUrls: ['./admin.css']
})
export class AdminComponent implements OnInit {

  providers: any[] = [];

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.loadProviders();
  }

  loadProviders() {
    this.adminService.getProviders().subscribe(data => {
      this.providers = data;
    });
  }

  approve(id: string) {
    this.adminService.approveProvider(id).subscribe(() => {
      this.loadProviders();
    });
  }

  reject(id: string) {
    this.adminService.rejectProvider(id).subscribe(() => {
      this.loadProviders();
    });
  }
}
