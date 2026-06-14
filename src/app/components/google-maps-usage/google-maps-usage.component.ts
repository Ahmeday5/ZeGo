import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { MapsUsageData, MapsSummaryData } from '../../types/dashboard.type';

@Component({
  selector: 'app-google-maps-usage',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './google-maps-usage.component.html',
  styleUrl: './google-maps-usage.component.scss',
})
export class GoogleMapsUsageComponent implements OnInit {
  fromDate = '';
  toDate = '';
  top = 10;

  usageData: MapsUsageData | null = null;
  summaryData: MapsSummaryData | null = null;

  loadingUsage = false;
  loadingSummary = false;
  errorUsage: string | null = null;
  errorSummary: string | null = null;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loadUsage();
    this.loadSummary();
  }

  private loadUsage(): void {
    this.loadingUsage = true;
    this.errorUsage = null;
    this.apiService.getGoogleMapsUsage({
      from: this.fromDate || undefined,
      to: this.toDate || undefined,
      top: this.top,
    }).subscribe({
      next: (data) => { this.usageData = data; this.loadingUsage = false; },
      error: (err) => { this.errorUsage = err.message; this.loadingUsage = false; },
    });
  }

  private loadSummary(): void {
    this.loadingSummary = true;
    this.errorSummary = null;
    this.apiService.getGoogleMapsSummary({
      from: this.fromDate || undefined,
      to: this.toDate || undefined,
    }).subscribe({
      next: (data) => { this.summaryData = data; this.loadingSummary = false; },
      error: (err) => { this.errorSummary = err.message; this.loadingSummary = false; },
    });
  }

  getSummaryCallsByEndpoint(type: string): number {
    return this.summaryData?.byEndpoint.find(e => e.endpointType === type)?.totalCalls ?? 0;
  }

  getSummaryFailedByEndpoint(type: string): number {
    return this.summaryData?.byEndpoint.find(e => e.endpointType === type)?.failedCalls ?? 0;
  }

  get totalFailed(): number {
    return this.summaryData?.byEndpoint.reduce((s, e) => s + e.failedCalls, 0) ?? 0;
  }

  getUserTypeLabel(type: string): string {
    return type === 'Client' ? 'عميل' : 'سائق';
  }

  getUserTypeBadgeClass(type: string): string {
    return type === 'Client' ? 'badge-client' : 'badge-driver';
  }

  getCallsPercent(calls: number): number {
    const total = this.usageData?.users.reduce((s, u) => s + u.totalCalls, 0) || 1;
    return Math.round((calls / total) * 100);
  }
}
