/**
 * vehicle-list.component.ts: Displays vehicle fleet directory, status filtering, and navigation to details.
 * Called by: Route '/vehicles' (Admin and Fleet Manager).
 */

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { VehicleService, Vehicle } from '../../../core/services/vehicle.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-vehicle-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './vehicle-list.component.html',
  styleUrl: './vehicle-list.component.scss'
})
export class VehicleListComponent implements OnInit {
  vehicles: Vehicle[] = [];
  searchQuery = '';
  statusFilter = '';
  loading = true;
  errorMessage = '';
  noticeMessage = '';

  constructor(
    private vehicleService: VehicleService,
    public auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadVehicles();
  }

  loadVehicles(): void {
    this.loading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.vehicleService.getAllVehicles().subscribe({
      next: (data) => {
        this.vehicles = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Failed to connect to the fleet registry. Please check network and retry.';
        this.cdr.detectChanges();
      },
    });
  }

  get filteredVehicles(): Vehicle[] {
    return this.vehicles.filter((v) => {
      const matchesSearch =
        !this.searchQuery ||
        v.registration_number.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        v.make?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        v.model?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        v.driver_name?.toLowerCase().includes(this.searchQuery.toLowerCase());

      const matchesStatus = !this.statusFilter || v.status === this.statusFilter;
      return matchesSearch && matchesStatus;
    });
  }

  goToDetail(id: number): void {
    this.router.navigate(['/vehicles', id]);
  }

  deleteVehicle(vehicle: Vehicle): void {
    if (confirm(`Are you sure you want to permanently remove vehicle ${vehicle.registration_number}?`)) {
      this.vehicleService.deleteVehicle(vehicle.id).subscribe({
        next: () => {
          this.vehicles = this.vehicles.filter((v) => v.id !== vehicle.id);
          this.noticeMessage = `Vehicle ${vehicle.registration_number} was successfully deleted.`;
          this.cdr.detectChanges();
        },
        error: (err) => {
          alert(err.error?.message || 'Failed to delete vehicle.');
          this.cdr.detectChanges();
        },
      });
    }
  }
}
