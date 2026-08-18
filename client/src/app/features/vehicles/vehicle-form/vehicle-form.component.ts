/**
 * vehicle-form.component.ts: Form for adding new vehicles or editing specifications and service intervals.
 * Called by: Routes '/vehicles/new' and '/vehicles/:id/edit' (Admin and Fleet Manager).
 */

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { VehicleService, Vehicle } from '../../../core/services/vehicle.service';
import { DriverService, Driver } from '../../../core/services/driver.service';

@Component({
  selector: 'app-vehicle-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './vehicle-form.component.html',
  styleUrl: './vehicle-form.component.scss'
})
export class VehicleFormComponent implements OnInit {
  form: FormGroup;
  isEditMode = false;
  vehicleId: number | null = null;
  drivers: Driver[] = [];
  loading = false;
  error = '';

  constructor(
    private fb: FormBuilder,
    private vehicleService: VehicleService,
    private driverService: DriverService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      registration_number: ['', Validators.required],
      make: ['', Validators.required],
      model: ['', Validators.required],
      year: [new Date().getFullYear(), [Validators.min(1900), Validators.max(2100)]],
      current_odometer_km: [0, [Validators.required, Validators.min(0)]],
      driver_id: [null],
      last_service_odometer_km: [0, [Validators.min(0)]],
      last_service_date: [null],
      service_interval_km: [5000, [Validators.required, Validators.min(500)]],
      status: ['active', Validators.required],
    });
  }

  ngOnInit(): void {
    this.driverService.getAll().subscribe({
      next: (data) => (this.drivers = data),
      error: () => {},
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.vehicleId = Number(id);
      this.vehicleService.getVehicleById(this.vehicleId).subscribe({
        next: (data) => {
          this.form.patchValue({
            ...data,
            last_service_date: data.last_service_date
              ? new Date(data.last_service_date).toISOString().split('T')[0]
              : null,
          });
        },
        error: () => (this.error = 'Failed to load vehicle details.'),
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = '';

    const req = this.isEditMode && this.vehicleId
      ? this.vehicleService.updateVehicle(this.vehicleId, this.form.value)
      : this.vehicleService.createVehicle(this.form.value);

    req.subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/vehicles']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Failed to save vehicle.';
      },
    });
  }
}
