/**
 * manager-dashboard.component.ts: Fleet operations dashboard displaying vehicle readiness, active incident counts, and maintenance trigger.
 * Called by: Route '/dashboard' (Admin and Fleet Manager).
 */

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { AlertService } from '../../core/services/alert.service';
import { environment } from '../../../environments/environment';

interface DashboardStats {
  vehicles: { total: string; active: string; in_service: string; retired: string };
  issues: { open_count: string; in_progress_count: string; minor_open: string; moderate_open: string; severe_open: string };
  alerts: { open_alerts: string };
  drivers: { total_drivers: string };
}

@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './manager-dashboard.component.html',
  styleUrl: './manager-dashboard.component.scss'
})
export class ManagerDashboardComponent implements OnInit {
  stats: DashboardStats | null = null;
  loading = true;
  checkRunning = false;
  maintenanceMessage = '';

  constructor(
    public auth: AuthService,
    private http: HttpClient,
    private alertService: AlertService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.loading = true;
    this.http.get<DashboardStats>(`${environment.apiUrl}/dashboard/stats`).subscribe({
      next: (stats) => {
        this.stats = stats;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  runMaintenanceCheck(): void {
    this.checkRunning = true;
    this.alertService.triggerMaintenanceCheck().subscribe({
      next: (res) => {
        this.checkRunning = false;
        this.maintenanceMessage = res.message || 'Stored procedure check_maintenance_due() executed successfully.';
        this.loadStats();
      },
      error: () => {
        this.checkRunning = false;
        this.maintenanceMessage = 'Maintenance check execution failed.';
        this.cdr.detectChanges();
      },
    });
  }
}
