/**
 * my-service-history.component.ts: Displays maintenance logbook and service history for the driver's assigned vehicle.
 * Called by: Route '/driver-dashboard/service-history' (Driver role).
 */

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DriverService } from '../../../core/services/driver.service';

@Component({
  selector: 'app-my-service-history',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './my-service-history.component.html',
  styleUrl: './my-service-history.component.scss'
})
export class MyServiceHistoryComponent implements OnInit {
  records: any[] = [];
  loading = true;

  constructor(
    private driverService: DriverService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.driverService.getMyServiceHistory().subscribe({
      next: (data) => {
        this.records = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }
}
