/**
 * issue.service.ts: HTTP client service for damage reports, incident filtering, and status updates.
 * Used by: IssueListComponent, ReportDamageComponent.
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Issue {
  id: number;
  vehicle_id: number;
  reported_by: number;
  damage_type: string;
  severity: 'minor' | 'moderate' | 'severe';
  title: string;
  description?: string;
  photo_url?: string;
  status: 'open' | 'in_progress' | 'resolved';
  created_at: string;
  reporter_name?: string;
  reporter_email?: string;
  registration_number?: string;
  make?: string;
  model?: string;
  vehicle_status?: string;
}

export interface IssueFormData {
  vehicle_id: number;
  damage_type?: string;
  severity: 'minor' | 'moderate' | 'severe';
  title: string;
  description?: string;
  photo_url?: string;
}

export interface IssueStats {
  open_count: string;
  in_progress_count: string;
  resolved_count: string;
  minor_open: string;
  moderate_open: string;
  severe_open: string;
}

@Injectable({ providedIn: 'root' })
export class IssueService {
  private readonly API = `${environment.apiUrl}/issues`;

  constructor(private http: HttpClient) {}

  getAll(filters?: { vehicle_id?: number; status?: string; severity?: string }): Observable<Issue[]> {
    let params = new HttpParams();
    if (filters?.vehicle_id) params = params.set('vehicle_id', filters.vehicle_id);
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.severity) params = params.set('severity', filters.severity);
    return this.http.get<Issue[]>(this.API, { params });
  }

  getById(id: number): Observable<Issue> {
    return this.http.get<Issue>(`${this.API}/${id}`);
  }

  create(data: IssueFormData): Observable<Issue> {
    return this.http.post<Issue>(this.API, data);
  }

  update(id: number, data: Partial<Issue>): Observable<Issue> {
    return this.http.patch<Issue>(`${this.API}/${id}`, data);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.API}/${id}`);
  }

  getStats(): Observable<IssueStats> {
    return this.http.get<IssueStats>(`${this.API}/stats`);
  }
}
