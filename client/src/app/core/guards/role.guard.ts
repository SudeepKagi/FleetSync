/**
 * role.guard.ts: Route guard factory enforcing role-based permissions (Admin, Fleet Manager, Driver).
 * Used by: Protected routes in app.routes.ts.
 */

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard = (...allowedRoles: string[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const user = authService.user();
    if (!user) {
      router.navigate(['/login']);
      return false;
    }

    if (allowedRoles.includes(user.role)) {
      return true;
    }

    // Role-based redirect fallback
    if (user.role === 'driver') {
      router.navigate(['/driver-dashboard']);
    } else {
      router.navigate(['/dashboard']);
    }
    return false;
  };
};
