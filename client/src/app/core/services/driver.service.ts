/**
 * driver.service.ts: HTTP client service for driver directory and driver self-service views.
 * Used by: DriverListComponent, DriverFormComponent, MyVehicleComponent, MyIssuesComponent, MyServiceHistoryComponent.
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Driver {
  id: number;
  user_id: number;
  name: string;
  license_number: string;
  phone: string;
  user_email?: string;
  vehicle_registration?: string;
  vehicle_id?: number;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_status?: string;
  created_at: string;
}

export interface DriverFormData {
  name: string;
  license_number: string;
  phone?: string;
  email: string;
  password?: string;
}

@Injectable({ providedIn: 'root' })
export class DriverService {
  private readonly API = `${environment.apiUrl}/drivers`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Driver[]> {
    return this.http.get<Driver[]>(this.API);
  }

  getById(id: number): Observable<Driver> {
    return this.http.get<Driver>(`${this.API}/${id}`);
  }

  create(data: DriverFormData): Observable<any> {
    return this.http.post(this.API, data);
  }

  update(id: number, data: Partial<DriverFormData>): Observable<Driver> {
    return this.http.put<Driver>(`${this.API}/${id}`, data);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.API}/${id}`);
  }

  getMyVehicle(): Observable<any> {
    return this.http.get<any>(`${this.API}/me/vehicle`);
  }

  getMyIssues(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API}/me/issues`);
  }

  getMyServiceHistory(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API}/me/service-history`);
  }
}
