/**
 * sidebar.component.ts: Renders role-based navigation links, real-time socket connection indicator, and user logout.
 * Used by: LayoutComponent
 */

import { Component, OnInit, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SocketService } from '../../../core/services/socket.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles: string[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private socketService = inject(SocketService);

  readonly currentUser = this.auth.user;
  readonly isConnected = toSignal(this.socketService.isConnected$, { initialValue: false });

  readonly navItems: NavItem[] = [
    // Manager / Admin Nav Items
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard', roles: ['admin', 'fleet_manager'] },
    { label: 'Live Fleet Map', icon: 'map', route: '/live-map', roles: ['admin', 'fleet_manager'] },
    { label: 'Vehicle Fleet', icon: 'directions_car', route: '/vehicles', roles: ['admin', 'fleet_manager'] },
    { label: 'Driver Roster', icon: 'person', route: '/drivers', roles: ['admin', 'fleet_manager'] },
    { label: 'Damage & Issues', icon: 'car_crash', route: '/issues', roles: ['admin', 'fleet_manager'] },
    { label: 'Maintenance Alerts', icon: 'build_circle', route: '/alerts', roles: ['admin', 'fleet_manager'] },
    { label: 'Audit Log', icon: 'history', route: '/audit-log', roles: ['admin'] },

    // Driver Nav Items
    { label: 'Assigned Vehicle', icon: 'directions_car', route: '/driver-dashboard', roles: ['driver'] },
    { label: 'Report Damage', icon: 'car_crash', route: '/driver-dashboard/report-damage', roles: ['driver'] },
    { label: 'My Issues', icon: 'report_problem', route: '/driver-dashboard/issues', roles: ['driver'] },
    { label: 'Service Logbook', icon: 'history_edu', route: '/driver-dashboard/service-history', roles: ['driver'] }
  ];

  readonly visibleNavItems = computed(() => {
    const role = this.currentUser()?.role;
    if (!role) return [];
    return this.navItems.filter((item) => item.roles.includes(role));
  });

  ngOnInit(): void {
    if (this.auth.isLoggedIn()) {
      this.socketService.connect();
    }
  }

  logout(): void {
    this.socketService.disconnect();
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
