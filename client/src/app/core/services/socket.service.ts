/**
 * socket.service.ts: Real-time Socket.io telematics gateway managing location updates, geofence breaches, and severe incident alerts.
 * Used by: LiveMapComponent, IssueListComponent, SidebarComponent.
 */

import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface LiveLocationUpdate {
  vehicle_id: number;
  registration_number: string;
  make: string;
  model: string;
  driver_name: string | null;
  latitude: number;
  longitude: number;
  recorded_at: string;
}

export interface GeofenceBreachAlert {
  vehicle_id: number;
  registration_number: string;
  driver_name: string;
  current_distance_km: number;
  allowed_radius_km: number;
  latitude: number;
  longitude: number;
  timestamp: string;
  message: string;
}

export interface SevereDamageAlert {
  issue_id: number;
  vehicle_id: number;
  registration_number: string;
  make: string;
  model: string;
  title: string;
  severity: string;
  damage_type: string;
  reported_by_name: string;
  timestamp: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket: Socket | null = null;

  private isConnectedSubject = new BehaviorSubject<boolean>(false);
  public isConnected$ = this.isConnectedSubject.asObservable();

  private locationUpdatesSubject = new Subject<LiveLocationUpdate>();
  public locationUpdates$ = this.locationUpdatesSubject.asObservable();

  private geofenceBreachSubject = new Subject<GeofenceBreachAlert>();
  public geofenceBreach$ = this.geofenceBreachSubject.asObservable();

  private severeIssueSubject = new Subject<SevereDamageAlert>();
  public severeIssue$ = this.severeIssueSubject.asObservable();

  constructor(private authService: AuthService) {}

  public connect(): void {
    const token = localStorage.getItem('fleetsync_token');
    if (!token) return;

    if (this.socket && this.socket.connected) return;

    const serverUrl = environment.apiUrl.replace(/\/api$/, '');

    this.socket = io(serverUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      this.isConnectedSubject.next(true);
    });

    this.socket.on('disconnect', () => {
      this.isConnectedSubject.next(false);
    });

    // Real-time Event Listeners
    this.socket.on('vehicle:location', (data: LiveLocationUpdate) => {
      this.locationUpdatesSubject.next(data);
    });

    this.socket.on('vehicle:geofence-breach', (data: GeofenceBreachAlert) => {
      this.geofenceBreachSubject.next(data);
    });

    this.socket.on('issue:severe-reported', (data: SevereDamageAlert) => {
      this.severeIssueSubject.next(data);
    });
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnectedSubject.next(false);
    }
  }
}
