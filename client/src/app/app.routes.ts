/**
 * app.routes.ts: Defines client application routing, route guards, and lazy-loaded feature components.
 * Used by: Angular Router via app.config.ts.
 */

import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { LayoutComponent } from './shared/components/layout/layout.component';

export const routes: Routes = [
  // ── Public Routes ────────────────────────────────────────────────────────────
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/landing/landing.component').then((m) => m.LandingComponent),
  },
  {
    path: 'landing',
    redirectTo: '',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },

  // ── Authenticated App Shell ──────────────────────────────────────────────────
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      // ── Manager / Admin Routes ───────────────────────────────────────────────
      {
        path: 'dashboard',
        canActivate: [roleGuard('admin', 'fleet_manager')],
        loadComponent: () =>
          import('./features/manager-dashboard/manager-dashboard.component').then(
            (m) => m.ManagerDashboardComponent
          ),
      },
      {
        path: 'live-map',
        canActivate: [roleGuard('admin', 'fleet_manager')],
        loadComponent: () =>
          import('./features/live-map/live-map.component').then((m) => m.LiveMapComponent),
      },
      {
        path: 'vehicles',
        canActivate: [roleGuard('admin', 'fleet_manager')],
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/vehicles/vehicle-list/vehicle-list.component').then(
                (m) => m.VehicleListComponent
              ),
          },
          {
            path: 'new',
            loadComponent: () =>
              import('./features/vehicles/vehicle-form/vehicle-form.component').then(
                (m) => m.VehicleFormComponent
              ),
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./features/vehicles/vehicle-detail/vehicle-detail.component').then(
                (m) => m.VehicleDetailComponent
              ),
          },
          {
            path: ':id/edit',
            loadComponent: () =>
              import('./features/vehicles/vehicle-form/vehicle-form.component').then(
                (m) => m.VehicleFormComponent
              ),
          },
        ],
      },
      {
        path: 'drivers',
        canActivate: [roleGuard('admin', 'fleet_manager')],
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/drivers/driver-list/driver-list.component').then(
                (m) => m.DriverListComponent
              ),
          },
          {
            path: 'new',
            loadComponent: () =>
              import('./features/drivers/driver-form/driver-form.component').then(
                (m) => m.DriverFormComponent
              ),
          },
          {
            path: ':id/edit',
            loadComponent: () =>
              import('./features/drivers/driver-form/driver-form.component').then(
                (m) => m.DriverFormComponent
              ),
          },
        ],
      },
      {
        path: 'issues',
        canActivate: [roleGuard('admin', 'fleet_manager')],
        loadComponent: () =>
          import('./features/issues/issue-list/issue-list.component').then(
            (m) => m.IssueListComponent
          ),
      },
      {
        path: 'alerts',
        canActivate: [roleGuard('admin', 'fleet_manager')],
        loadComponent: () =>
          import('./features/alerts/alert-list/alert-list.component').then(
            (m) => m.AlertListComponent
          ),
      },
      {
        path: 'audit-log',
        canActivate: [roleGuard('admin')],
        loadComponent: () =>
          import('./features/audit-log/audit-log.component').then((m) => m.AuditLogComponent),
      },

      // ── Driver Routes ────────────────────────────────────────────────────────
      {
        path: 'driver-dashboard',
        canActivate: [roleGuard('driver')],
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/driver-dashboard/my-vehicle/my-vehicle.component').then(
                (m) => m.MyVehicleComponent
              ),
          },
          {
            path: 'report-damage',
            loadComponent: () =>
              import('./features/driver-dashboard/report-damage/report-damage.component').then(
                (m) => m.ReportDamageComponent
              ),
          },
          {
            path: 'issues',
            loadComponent: () =>
              import('./features/driver-dashboard/my-issues/my-issues.component').then(
                (m) => m.MyIssuesComponent
              ),
          },
          {
            path: 'service-history',
            loadComponent: () =>
              import('./features/driver-dashboard/my-service-history/my-service-history.component').then(
                (m) => m.MyServiceHistoryComponent
              ),
          },
        ],
      },
      // Backward compatibility alias for driver routes
      {
        path: 'driver',
        redirectTo: 'driver-dashboard',
        pathMatch: 'prefix',
      },
    ],
  },

  // Fallback route
  { path: '**', redirectTo: '/login' },
];
