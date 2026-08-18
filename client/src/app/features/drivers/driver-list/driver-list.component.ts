/**
 * driver-list.component.ts: Displays active drivers roster, vehicle assignment status, and contact details.
 * Called by: Route '/drivers' (Admin and Fleet Manager).
 */

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DriverService, Driver } from '../../../core/services/driver.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-driver-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './driver-list.component.html',
  styleUrl: './driver-list.component.scss'
})
export class DriverListComponent implements OnInit {
  drivers: Driver[] = [];
  searchQuery = '';
  loading = true;
  errorMessage = '';
  noticeMessage = '';

  constructor(
    private driverService: DriverService,
    public auth: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadDrivers();
  }

  loadDrivers(): void {
    this.loading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.driverService.getAll().subscribe({
      next: (data) => {
        this.drivers = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Failed to connect to the driver roster. Please check network and retry.';
        this.cdr.detectChanges();
      },
    });
  }

  get filteredDrivers(): Driver[] {
    return this.drivers.filter((d) => {
      return (
        !this.searchQuery ||
        d.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        d.license_number.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        d.phone?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        d.user_email?.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    });
  }

  deleteDriver(driver: Driver): void {
    if (confirm(`Are you sure you want to remove driver ${driver.name}?`)) {
      this.driverService.delete(driver.id).subscribe({
        next: () => {
          this.drivers = this.drivers.filter((d) => d.id !== driver.id);
          this.noticeMessage = `Driver ${driver.name} was removed from the roster.`;
          this.cdr.detectChanges();
        },
        error: (err) => {
          alert(err.error?.message || 'Failed to delete driver.');
          this.cdr.detectChanges();
        },
      });
    }
  }
}
