/**
 * my-vehicle.component.ts: Mobile portal for drivers to check assigned vehicle health, mileage, and active alerts.
 * Called by: Route '/driver-dashboard' (Driver role).
 */

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DriverService } from '../../../core/services/driver.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-my-vehicle',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './my-vehicle.component.html',
  styleUrl: './my-vehicle.component.scss'
})
export class MyVehicleComponent implements OnInit {
  vehicle: any = null;
  loading = true;

  get kmUntilService(): number {
    if (!this.vehicle) return 0;
    const interval = this.vehicle.service_interval_km || 5000;
    const current = this.vehicle.current_odometer_km || 0;
    const last = this.vehicle.last_service_odometer_km || 0;
    return interval - (current - last);
  }

  constructor(
    public auth: AuthService,
    private driverService: DriverService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.driverService.getMyVehicle().subscribe({
      next: (data) => {
        this.vehicle = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.vehicle = null;
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }
}
