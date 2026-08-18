/**
 * audit.service.ts: HTTP client service for querying administrative audit logs.
 * Used by: AuditLogComponent.
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AuditLogItem {
  id: number;
  user_id: number;
  action: string;
  entity_type: string;
  entity_id: number | null;
  details: any;
  created_at: string;
  user_name?: string;
  user_email?: string;
  user_role?: string;
}

export interface AuditLogResponse {
  total: number;
  logs: AuditLogItem[];
}

@Injectable({ providedIn: 'root' })
export class AuditService {
  private readonly API = `${environment.apiUrl}/audit-log`;

  constructor(private http: HttpClient) {}

  getAuditLogs(entityType?: string, limit = 50, offset = 0): Observable<AuditLogResponse> {
    let params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString());

    if (entityType && entityType !== 'all') {
      params = params.set('entity_type', entityType);
    }

    return this.http.get<AuditLogResponse>(this.API, { params });
  }
}
