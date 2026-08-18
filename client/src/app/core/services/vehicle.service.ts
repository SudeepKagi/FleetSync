/**
 * vehicle.service.ts: HTTP client service for vehicles, geofences, telemetry, and PDF report downloads.
 * Used by: VehicleListComponent, VehicleDetailComponent, LiveMapComponent.
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Vehicle {
  id: number;
  registration_number: string;
  make: string;
  model: string;
  year?: number;
  current_odometer_km: number;
  driver_id?: number | null;
  driver_name?: string;
  driver_license?: string;
  driver_phone?: string;
  last_service_odometer_km: number;
  last_service_date?: string | null;
  service_interval_km: number;
  status: 'active' | 'in_service' | 'retired';
  created_at: string;
  current_lat?: number;
  current_lng?: number;
  geofence_lat?: number;
  geofence_lng?: number;
  geofence_radius_km?: number;
  predicted_service_date?: string | null;
  service_records?: any[];
  issues?: any[];
  alerts?: any[];
}

export interface GeofenceZone {
  id?: number;
  vehicle_id: number;
  center_lat: number;
  center_lng: number;
  radius_km: number;
}

export interface PredictedDateResponse {
  vehicle_id: number;
  predicted_service_date: string;
  days_remaining: number;
}

@Injectable({ providedIn: 'root' })
export class VehicleService {
  private readonly API = `${environment.apiUrl}/vehicles`;

  constructor(private http: HttpClient) {}

  getAllVehicles(): Observable<Vehicle[]> {
    return this.http.get<Vehicle[]>(this.API);
  }

  getVehicleById(id: number): Observable<Vehicle> {
    return this.http.get<Vehicle>(`${this.API}/${id}`);
  }

  createVehicle(data: Partial<Vehicle>): Observable<Vehicle> {
    return this.http.post<Vehicle>(this.API, data);
  }

  updateVehicle(id: number, data: Partial<Vehicle>): Observable<Vehicle> {
    return this.http.put<Vehicle>(`${this.API}/${id}`, data);
  }

  deleteVehicle(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API}/${id}`);
  }

  getPredictedServiceDate(id: number): Observable<PredictedDateResponse> {
    return this.http.get<PredictedDateResponse>(`${this.API}/${id}/predicted-service-date`);
  }

  getGeofence(id: number): Observable<GeofenceZone> {
    return this.http.get<GeofenceZone>(`${this.API}/${id}/geofence`);
  }

  saveGeofence(id: number, data: { center_lat: number; center_lng: number; radius_km: number }): Observable<GeofenceZone> {
    return this.http.post<GeofenceZone>(`${this.API}/${id}/geofence`, data);
  }

  getLatestLocations(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API}/locations/latest`);
  }

  downloadPdfReport(id: number): Observable<Blob> {
    return this.http.get(`${this.API}/${id}/report/pdf`, { responseType: 'blob' });
  }
}
