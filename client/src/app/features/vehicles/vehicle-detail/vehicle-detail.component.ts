/**
 * vehicle-detail.component.ts: Displays vehicle specifications, predictive maintenance forecast, service history, and PDF download.
 * Called by: Route '/vehicles/:id' (Admin and Fleet Manager).
 */

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { VehicleService, Vehicle } from '../../../core/services/vehicle.service';

@Component({
  selector: 'app-vehicle-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './vehicle-detail.component.html',
  styleUrl: './vehicle-detail.component.scss'
})
export class VehicleDetailComponent implements OnInit {
  vehicle: Vehicle | null = null;
  geofenceRadiusKm = 15;
  downloadingPdf = false;
  savingGeofence = false;
  loading = true;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private vehicleService: VehicleService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.loadVehicle(id);
    }
  }

  loadVehicle(id: number): void {
    this.loading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.vehicleService.getVehicleById(id).subscribe({
      next: (data) => {
        this.vehicle = data;
        this.geofenceRadiusKm = data.geofence_radius_km || 15;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading vehicle details:', err);
        this.loading = false;
        this.errorMessage = err.error?.message || 'Failed to load vehicle profile.';
        this.cdr.detectChanges();
      },
    });
  }

  saveGeofence(): void {
    if (!this.vehicle) return;
    this.savingGeofence = true;
    this.cdr.detectChanges();

    this.vehicleService
      .saveGeofence(this.vehicle.id, {
        center_lat: this.vehicle.geofence_lat || 37.7749,
        center_lng: this.vehicle.geofence_lng || -122.4194,
        radius_km: Number(this.geofenceRadiusKm),
      })
      .subscribe({
        next: () => {
          this.savingGeofence = false;
          alert('Geofence zone radius updated successfully!');
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.savingGeofence = false;
          alert(err.error?.message || 'Failed to update geofence.');
          this.cdr.detectChanges();
        },
      });
  }

  downloadPdfReport(): void {
    if (!this.vehicle) return;
    this.downloadingPdf = true;
    this.cdr.detectChanges();

    this.vehicleService.downloadPdfReport(this.vehicle.id).subscribe({
      next: (blob) => {
        this.downloadingPdf = false;
        this.cdr.detectChanges();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `FleetSync_Vehicle_${this.vehicle?.registration_number}_Report.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.downloadingPdf = false;
        this.cdr.detectChanges();
        alert('Failed to generate PDF report.');
      },
    });
  }
}
