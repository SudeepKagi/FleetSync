/**
 * landing.data.ts: Static content data for the FleetSync showcase landing page.
 * Used by: LandingComponent to render feature cards, architecture stack, and demo accounts.
 */

export interface FeatureItem {
  title: string;
  description: string;
  techTag: string;
  icon: string;
  route?: string;
}

export interface TechStackItem {
  name: string;
  role: string;
  whyChosen: string;
  icon: string;
}

export interface DemoAccount {
  role: string;
  email: string;
  password: string;
  description: string;
  badgeClass: string;
  route: string;
}

export const LANDING_FEATURES: FeatureItem[] = [
  {
    title: 'Live Vehicle Tracking on Map',
    description: 'Vehicle positions and speeds stream in real-time over WebSocket connections without needing page refreshes.',
    techTag: 'Socket.io + Leaflet.js',
    icon: 'map',
    route: '/live-map',
  },
  {
    title: 'Predictive Maintenance Forecasting',
    description: 'Calculates rolling average km/day per vehicle using a custom database function to forecast the exact next service date.',
    techTag: 'PostgreSQL PL/pgSQL',
    icon: 'calculate',
    route: '/alerts',
  },
  {
    title: 'Instant Damage & Incident Alerts',
    description: 'Drivers submit vehicle damage reports with severity levels (minor, moderate, severe), automatically notifying managers.',
    techTag: 'Database Triggers',
    icon: 'warning',
    route: '/issues',
  },
  {
    title: 'Role-Based Access Control',
    description: 'Dedicated interfaces and route guards for Super Admin (governance), Fleet Manager (operations), and Driver (mobile view).',
    techTag: 'JWT + Angular Guards',
    icon: 'lock',
    route: '/dashboard',
  },
  {
    title: 'Mobile Driver Portal',
    description: 'A mobile-friendly dashboard where assigned drivers view vehicle status, mileage, and submit 1-tap issue reports.',
    techTag: 'Responsive Angular',
    icon: 'smartphone',
    route: '/driver-dashboard',
  },
  {
    title: 'Vehicle & Driver Directory',
    description: 'Manage vehicle specifications, assigned drivers, and circular geofence operating zones from a single interface.',
    techTag: 'PostgreSQL Relational Data',
    icon: 'garage',
    route: '/vehicles',
  },
  {
    title: 'Auto-Generated PDF Service History',
    description: 'Generates and downloads clean, printable vehicle service history and inspection reports on demand from the server.',
    techTag: 'Node.js PDFKit',
    icon: 'picture_as_pdf',
    route: '/vehicles',
  },
  {
    title: 'Immutable Audit Logging',
    description: 'Every write and status change is recorded to an audit_logs table with user ID, action, entity, and timestamp for traceability.',
    techTag: 'PostgreSQL Schema',
    icon: 'history',
    route: '/audit-log',
  },
];

export const TECH_STACK: TechStackItem[] = [
  {
    name: 'Angular 18 (Client)',
    role: 'Frontend UI',
    whyChosen: 'Used Standalone Components and Angular Signals for reactive UI state without heavy state-management boilerplate.',
    icon: 'code',
  },
  {
    name: 'Node.js + Express (Server)',
    role: 'Backend REST API',
    whyChosen: 'Lightweight asynchronous runtime providing fast JSON endpoints and clean separation of route controllers and middleware.',
    icon: 'dns',
  },
  {
    name: 'Socket.io',
    role: 'Real-Time Telematics',
    whyChosen: 'Enables bi-directional WebSocket communication to push live GPS coordinate pings directly to connected map views.',
    icon: 'sensors',
  },
  {
    name: 'PostgreSQL + PL/pgSQL',
    role: 'Database & Stored Procs',
    whyChosen: 'Fleet data is strictly relational (vehicles, drivers, service records). Stored procedures run maintenance checks right in the database.',
    icon: 'storage',
  },
  {
    name: 'Leaflet.js',
    role: 'Interactive Maps',
    whyChosen: 'Open-source, lightweight map library that renders dynamic vehicle markers with custom status popups and color-coded icons.',
    icon: 'layers',
  },
  {
    name: 'PDFKit',
    role: 'Document Generation',
    whyChosen: 'Server-side PDF streaming for on-demand downloadable vehicle maintenance history reports.',
    icon: 'picture_as_pdf',
  },
];

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: 'Fleet Manager',
    email: 'manager@fleetsync.com',
    password: 'Password123!',
    description: 'Access fleet overview, live GPS map, maintenance alerts, and analytics.',
    badgeClass: 'badge-manager',
    route: '/dashboard',
  },
  {
    role: 'Driver',
    email: 'marcus@fleetsync.com',
    password: 'Password123!',
    description: 'Mobile view to check assigned vehicle health and report damage.',
    badgeClass: 'badge-driver',
    route: '/driver-dashboard',
  },
  {
    role: 'Super Admin',
    email: 'admin@fleetsync.com',
    password: 'Password123!',
    description: 'Full administrative access across vehicles, drivers, and immutable audit logs.',
    badgeClass: 'badge-admin',
    route: '/dashboard',
  },
];
