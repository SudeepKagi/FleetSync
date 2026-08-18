/**
 * report-damage.component.ts: Camera photo upload and triage form for drivers reporting vehicle damage.
 * Called by: Route '/driver-dashboard/report-damage' (Driver role).
 */

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IssueService } from '../../../core/services/issue.service';
import { DriverService } from '../../../core/services/driver.service';

@Component({
  selector: 'app-report-damage',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './report-damage.component.html',
  styleUrl: './report-damage.component.scss'
})
export class ReportDamageComponent implements OnInit {
  form: FormGroup;
  vehicle: any = null;
  loading = false;
  submitted = false;
  error = '';
  photoPreview: string | null = null;

  constructor(
    private fb: FormBuilder,
    private issueService: IssueService,
    private driverService: DriverService
  ) {
    this.form = this.fb.group({
      damage_type: ['bumper', Validators.required],
      severity: ['minor', Validators.required],
      title: ['', Validators.required],
      description: [''],
      photo_url: [''],
    });
  }

  ngOnInit(): void {
    this.driverService.getMyVehicle().subscribe({
      next: (v) => (this.vehicle = v),
      error: () => (this.error = 'Unable to fetch assigned vehicle.'),
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      if (!file.type.startsWith('image/')) {
        this.error = 'Please select a valid image file (JPEG, PNG, WEBP).';
        return;
      }

      if (file.size > 8 * 1024 * 1024) {
        this.error = 'Image size is too large. Please select a photo under 8MB.';
        return;
      }

      this.error = '';
      const reader = new FileReader();
      reader.onload = () => {
        const base64Data = reader.result as string;
        this.photoPreview = base64Data;
        this.form.patchValue({ photo_url: base64Data });
      };
      reader.readAsDataURL(file);
    }
  }

  removePhoto(): void {
    this.photoPreview = null;
    this.form.patchValue({ photo_url: '' });
  }

  onSubmit(): void {
    if (this.form.invalid || !this.vehicle) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = '';

    const payload = {
      vehicle_id: this.vehicle.id,
      damage_type: this.form.value.damage_type,
      severity: this.form.value.severity,
      title: this.form.value.title,
      description: this.form.value.description,
      photo_url: this.form.value.photo_url || null,
    };

    this.issueService.create(payload).subscribe({
      next: () => {
        this.loading = false;
        this.submitted = true;
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Failed to submit report.';
      },
    });
  }

  resetForm(): void {
    this.submitted = false;
    this.photoPreview = null;
    this.form.reset({
      damage_type: 'bumper',
      severity: 'minor',
      title: '',
      description: '',
      photo_url: '',
    });
  }
}
