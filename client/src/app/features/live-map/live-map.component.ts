/**
 * live-map.component.ts: Interactive Leaflet.js map rendering real-time vehicle GPS positions and geofence radii.
 * Called by: Route '/live-map' (Admin and Fleet Manager).
 */

import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import * as L from 'leaflet';
import { VehicleService } from '../../core/services/vehicle.service';
import { SocketService, LiveLocationUpdate } from '../../core/services/socket.service';

@Component({
  selector: 'app-live-map',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './live-map.component.html',
  styleUrl: './live-map.component.scss'
})
export class LiveMapComponent implements OnInit, AfterViewInit, OnDestroy {
  vehicles: any[] = [];
  selectedVehicleId: number | null = null;
  isLive = false;

  private map: L.Map | null = null;
  private markers: Map<number, L.Marker> = new Map();
  private geofenceCircles: Map<number, L.Circle> = new Map();
  private subscriptions: Subscription[] = [];

  constructor(
    private vehicleService: VehicleService,
    private socketService: SocketService
  ) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.socketService.isConnected$.subscribe((connected) => {
        this.isLive = connected;
      })
    );

    this.subscriptions.push(
      this.socketService.locationUpdates$.subscribe((update: LiveLocationUpdate) => {
        this.updateVehicleMarker(update);
      })
    );
  }

  ngAfterViewInit(): void {
    this.initLeafletMap();
    this.loadVehicles();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  private initLeafletMap(): void {
    this.map = L.map('fleetMap', {
      center: [37.7749, -122.4194],
      zoom: 11,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors | FleetSync Telematics',
      maxZoom: 19,
    }).addTo(this.map);
  }

  private loadVehicles(): void {
    this.vehicleService.getLatestLocations().subscribe({
      next: (data) => {
        this.vehicles = data;
        this.renderAllVehiclesOnMap();
      },
      error: (err) => {
        console.error('Error loading initial fleet positions:', err);
      },
    });
  }

  private renderAllVehiclesOnMap(): void {
    if (!this.map) return;

    const bounds = L.latLngBounds([]);

    this.vehicles.forEach((v) => {
      const lat = Number(v.latitude) || 37.7749;
      const lng = Number(v.longitude) || -122.4194;
      const latLng = L.latLng(lat, lng);
      bounds.extend(latLng);

      const customIcon = L.divIcon({
        className: 'custom-fleet-marker',
        html: `
          <div style="
            background: #0052FF;
            color: #FFFFFF;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid #FFFFFF;
            box-shadow: 0 4px 10px rgba(0, 82, 255, 0.4);
          ">
            <span class="material-icons" style="font-size: 18px;">directions_car</span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -18],
      });

      const marker = L.marker(latLng, { icon: customIcon }).addTo(this.map!);
      marker.bindPopup(`
        <div style="font-family: 'Plus Jakarta Sans', sans-serif; padding: 4px;">
          <h4 style="margin: 0 0 4px; font-weight: 700; color: #0F172A;">${v.registration_number}</h4>
          <p style="margin: 0 0 6px; font-size: 12px; color: #64748B;">${v.make} ${v.model}</p>
          <div style="font-size: 11px; color: #334155;"><strong>Driver:</strong> ${v.driver_name || 'Unassigned'}</div>
          <div style="margin-top: 8px;">
            <a href="/vehicles/${v.vehicle_id}" style="color: #0052FF; font-weight: 600; font-size: 11px; text-decoration: none;">View Vehicle Dossier →</a>
          </div>
        </div>
      `);

      this.markers.set(v.vehicle_id, marker);

      if (v.geofence_lat && v.geofence_lng && v.geofence_radius_km) {
        const circle = L.circle([Number(v.geofence_lat), Number(v.geofence_lng)], {
          radius: Number(v.geofence_radius_km) * 1000,
          color: '#0052FF',
          fillColor: '#0052FF',
          fillOpacity: 0.08,
          weight: 1.5,
          dashArray: '4, 6',
        }).addTo(this.map!);
        this.geofenceCircles.set(v.vehicle_id, circle);
      }
    });

    if (this.vehicles.length > 0 && bounds.isValid()) {
      this.map.fitBounds(bounds, { padding: [40, 40] });
    }
  }

  private updateVehicleMarker(update: LiveLocationUpdate): void {
    if (!this.map) return;

    const latLng = L.latLng(update.latitude, update.longitude);

    if (this.markers.has(update.vehicle_id)) {
      const marker = this.markers.get(update.vehicle_id)!;
      marker.setLatLng(latLng);
    }

    const found = this.vehicles.find((v) => v.vehicle_id === update.vehicle_id);
    if (found) {
      found.latitude = update.latitude;
      found.longitude = update.longitude;
    }
  }

  selectVehicle(vehicle: any): void {
    this.selectedVehicleId = vehicle.id || vehicle.vehicle_id;
    const vId = vehicle.vehicle_id || vehicle.id;
    const marker = this.markers.get(vId);

    if (marker && this.map) {
      const pos = marker.getLatLng();
      this.map.flyTo(pos, 14, { duration: 1.2 });
      marker.openPopup();
    }
  }

  resetMapView(): void {
    if (!this.map) return;
    const bounds = L.latLngBounds([]);
    this.markers.forEach((m) => bounds.extend(m.getLatLng()));
    if (bounds.isValid()) {
      this.map.fitBounds(bounds, { padding: [40, 40] });
    }
  }
}
