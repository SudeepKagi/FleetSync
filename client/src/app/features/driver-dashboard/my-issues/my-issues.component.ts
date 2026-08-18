/**
 * my-issues.component.ts: Displays damage and incident reports submitted by the logged-in driver.
 * Called by: Route '/driver-dashboard/issues' (Driver role).
 */

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DriverService } from '../../../core/services/driver.service';

@Component({
  selector: 'app-my-issues',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './my-issues.component.html',
  styleUrl: './my-issues.component.scss'
})
export class MyIssuesComponent implements OnInit {
  issues: any[] = [];
  loading = true;

  constructor(
    private driverService: DriverService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.driverService.getMyIssues().subscribe({
      next: (data) => {
        this.issues = data;
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
