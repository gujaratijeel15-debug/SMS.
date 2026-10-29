import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProviderService } from '../../../../services/provider';

@Component({
  selector: 'app-provider-earnings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './earnings.html',
  styleUrls: ['./earnings.css']
})
export class ProviderEarningsComponent implements OnInit {

  jobs: any[] = [];
  total = 0;

  constructor(private providerService: ProviderService) {}

  ngOnInit() {
    this.providerService.getEarnings()
      .subscribe((res: any) => {
        this.jobs = res.jobs;
        this.total = res.totalEarnings;
      });
  }
}