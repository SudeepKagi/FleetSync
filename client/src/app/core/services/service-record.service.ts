/**
 * service-record.service.ts: HTTP client service for querying and creating vehicle service history records.
 * Used by: VehicleDetailComponent, MyServiceHistoryComponent.
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ServiceRecord {
  id: number;
  vehicle_id: number;
  service_date: string;
  odometer_km: number;
  description: string;
  cost: number;
  created_at: string;
  registration_number?: string;
  make?: string;
  model?: string;
}

@Injectable({ providedIn: 'root' })
export class ServiceRecordService {
  private readonly API = `${environment.apiUrl}/service-records`;

  constructor(private http: HttpClient) {}

  getAll(vehicleId?: number): Observable<ServiceRecord[]> {
    let params = new HttpParams();
    if (vehicleId) params = params.set('vehicle_id', vehicleId);
    return this.http.get<ServiceRecord[]>(this.API, { params });
  }

  getById(id: number): Observable<ServiceRecord> {
    return this.http.get<ServiceRecord>(`${this.API}/${id}`);
  }

  create(data: {
    vehicle_id: number;
    service_date: string;
    odometer_km: number;
    description?: string;
    cost?: number;
  }): Observable<ServiceRecord> {
    return this.http.post<ServiceRecord>(this.API, data);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.API}/${id}`);
  }
}
