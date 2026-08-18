/**
 * alert.service.ts: HTTP client service for maintenance alerts and triggering PL/pgSQL procedures.
 * Used by: AlertListComponent, ManagerDashboardComponent.
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Alert {
  id: number;
  vehicle_id: number;
  alert_type: 'odometer_due' | 'date_overdue' | 'never_serviced';
  message: string;
  is_resolved: boolean;
  created_at: string;
  registration_number?: string;
  make?: string;
  model?: string;
  vehicle_status?: string;
}

export interface AlertStats {
  open_alerts: string;
  resolved_alerts: string;
  total_alerts: string;
}

@Injectable({ providedIn: 'root' })
export class AlertService {
  private readonly API = `${environment.apiUrl}/alerts`;

  constructor(private http: HttpClient) {}

  getAll(includeResolved = false): Observable<Alert[]> {
    const params = includeResolved ? '?resolved=true' : '';
    return this.http.get<Alert[]>(`${this.API}${params}`);
  }

  resolve(id: number): Observable<any> {
    return this.http.patch(`${this.API}/${id}/resolve`, {});
  }

  getStats(): Observable<AlertStats> {
    return this.http.get<AlertStats>(`${this.API}/stats`);
  }

  triggerMaintenanceCheck(): Observable<any> {
    return this.http.post(`${environment.apiUrl}/maintenance/check`, {});
  }
}
