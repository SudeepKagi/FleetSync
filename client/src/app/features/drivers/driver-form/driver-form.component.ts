/**
 * driver-form.component.ts: Form for onboarding new drivers with login credentials or updating contact info.
 * Called by: Routes '/drivers/new' and '/drivers/:id/edit' (Admin and Fleet Manager).
 */

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { DriverService } from '../../../core/services/driver.service';

@Component({
  selector: 'app-driver-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './driver-form.component.html',
  styleUrl: './driver-form.component.scss'
})
export class DriverFormComponent implements OnInit {
  form: FormGroup;
  loading = false;
  error = '';
  isEditMode = false;
  driverId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private driverService: DriverService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      license_number: ['', Validators.required],
      phone: [''],
      email: ['', [Validators.required, Validators.email]],
      password: ['Password123!', [Validators.required, Validators.minLength(6)]],
    });
  }

  ngOnInit(): void {
    this.driverId = this.route.snapshot.params['id'] ? Number(this.route.snapshot.params['id']) : null;
    this.isEditMode = !!this.driverId;

    if (this.isEditMode) {
      this.form.get('email')?.clearValidators();
      this.form.get('password')?.clearValidators();
      this.form.get('email')?.updateValueAndValidity();
      this.form.get('password')?.updateValueAndValidity();

      if (this.driverId) {
        this.driverService.getById(this.driverId).subscribe({
          next: (d) => this.form.patchValue(d),
          error: () => (this.error = 'Failed to load driver details.'),
        });
      }
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = '';

    const req = this.isEditMode && this.driverId
      ? this.driverService.update(this.driverId, this.form.value)
      : this.driverService.create(this.form.value);

    req.subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/drivers']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Failed to save driver.';
      },
    });
  }
}
