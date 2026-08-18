/**
 * landing.component.ts: Presentation and interactive 1-click demo portal for the FleetSync showcase landing page.
 * Called by: Route '' (Public entry point).
 */

import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService, AuthResponse } from '../../core/services/auth.service';
import { LANDING_FEATURES, TECH_STACK, DEMO_ACCOUNTS, DemoAccount } from './landing.data';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
})
export class LandingComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  // Authentication State
  readonly currentUser = this.authService.user;
  readonly isLoggedIn = this.authService.isLoggedIn;
  readonly userRole = computed(() => this.currentUser()?.role || null);

  readonly githubUrl = 'https://github.com/SudeepKagi/FleetSync';
  readonly features = LANDING_FEATURES;
  readonly techStack = TECH_STACK;
  readonly demoAccounts = DEMO_ACCOUNTS;

  mobileMenuOpen = false;
  loggingInRole: string | null = null;
  loginError = '';

  toggleMobileNav(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileNav(): void {
    this.mobileMenuOpen = false;
  }

  // 1-Click Quick Demo Login
  launchDemo(account: DemoAccount): void {
    this.loggingInRole = account.role;
    this.loginError = '';

    this.authService.login(account.email, account.password).subscribe({
      next: (res: AuthResponse) => {
        this.loggingInRole = null;
        this.router.navigate([res.user.role === 'driver' ? '/driver-dashboard' : '/dashboard']);
      },
      error: (err: any) => {
        this.loggingInRole = null;
        this.loginError = err.error?.message || 'Could not connect to the backend server.';
      },
    });
  }

  accessPortal(): void {
    if (this.isLoggedIn()) {
      const user = this.currentUser();
      this.router.navigate([user?.role === 'driver' ? '/driver-dashboard' : '/dashboard']);
    } else {
      this.router.navigate(['/login']);
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  scrollToSection(id: string): void {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
