/**
 * alert-list.component.ts: Displays maintenance alerts, resolution toggles, and triggers procedure checks.
 * Called by: Route '/alerts' (Admin and Fleet Manager).
 */

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AlertService, Alert } from '../../../core/services/alert.service';

@Component({
  selector: 'app-alert-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './alert-list.component.html',
  styleUrl: './alert-list.component.scss'
})
export class AlertListComponent implements OnInit {
  alerts: Alert[] = [];
  loading = true;
  checking = false;
  showResolved = false;
  noticeMessage = '';

  get openAlerts(): Alert[] {
    return this.alerts.filter((a) => !a.is_resolved);
  }

  get resolvedAlerts(): Alert[] {
    return this.alerts.filter((a) => a.is_resolved);
  }

  constructor(
    private alertService: AlertService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAlerts();
  }

  loadAlerts(): void {
    this.loading = true;
    this.cdr.detectChanges();

    this.alertService.getAll(this.showResolved).subscribe({
      next: (data) => {
        this.alerts = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  toggleResolved(): void {
    this.showResolved = !this.showResolved;
    this.loadAlerts();
  }

  resolveAlert(alert: Alert): void {
    this.alertService.resolve(alert.id).subscribe({
      next: () => {
        alert.is_resolved = true;
        this.cdr.detectChanges();
      },
      error: () => {
        window.alert('Failed to resolve alert.');
        this.cdr.detectChanges();
      },
    });
  }

  runCheck(): void {
    this.checking = true;
    this.cdr.detectChanges();

    this.alertService.triggerMaintenanceCheck().subscribe({
      next: (res) => {
        this.checking = false;
        this.noticeMessage = res.message || 'check_maintenance_due() executed.';
        this.loadAlerts();
      },
      error: () => {
        this.checking = false;
        this.noticeMessage = 'Failed to execute maintenance check.';
        this.cdr.detectChanges();
      },
    });
  }

  getAlertIcon(type: string): string {
    const map: Record<string, string> = {
      odometer_due: 'speed',
      date_overdue: 'calendar_month',
      never_serviced: 'warning',
    };
    return map[type] || 'notifications';
  }

  getAlertIconClass(type: string): string {
    const map: Record<string, string> = {
      odometer_due: 'icon-odometer',
      date_overdue: 'icon-date',
      never_serviced: 'icon-never',
    };
    return map[type] || '';
  }

  getAlertBadgeClass(type: string): string {
    const map: Record<string, string> = {
      odometer_due: 'badge-moderate',
      date_overdue: 'badge-severe',
      never_serviced: 'badge-minor',
    };
    return map[type] || 'badge-minor';
  }

  getAlertTypeLabel(type: string): string {
    const map: Record<string, string> = {
      odometer_due: 'Odometer Overdue',
      date_overdue: '90-Day Schedule Overdue',
      never_serviced: 'Never Serviced',
    };
    return map[type] || type;
  }
}
