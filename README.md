# FleetSync — Real-Time Vehicle Fleet Management System

[![Angular](https://img.shields.io/badge/Angular-18-DD0031?logo=angular&logoColor=white)](https://angular.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-PL%2FpgSQL-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-Real--Time-010101?logo=socketdotio&logoColor=white)](https://socket.io/)
[![Leaflet](https://img.shields.io/badge/Leaflet-GPS%20Maps-199900?logo=leaflet&logoColor=white)](https://leafletjs.com/)

**FleetSync** is a full-stack vehicle fleet management system with real-time GPS tracking, rule-based maintenance alerts, role-based access control, and mobile damage reporting. Built as a college capstone project to demonstrate end-to-end software engineering across Angular 18, Node.js, PostgreSQL PL/pgSQL, and Socket.io.

---

## Features

- **Live GPS Fleet Map** — Vehicle positions broadcast over Socket.io WebSocket and rendered on an interactive Leaflet.js map.
- **Predictive Maintenance** — PL/pgSQL stored procedure `predict_service_date(p_vehicle_id)` forecasts next service date based on rolling km/day usage.
- **Automated Rule-Based Alerts** — Stored procedure `check_maintenance_due()` flags vehicles exceeding odometer or 90-day thresholds. Runs hourly via cron job.
- **Geofencing** — Circular geofence zones per vehicle with Haversine distance calculation; breaches emit real-time Socket.io alerts.
- **PDF Service Dossier** — Streaming per-vehicle maintenance PDF generated with `pdfkit`.
- **Damage Incident Reporting** — Driver mobile portal: report damage with camera photo capture (`capture="environment"`) or gallery upload; severe incidents auto-alert fleet managers.
- **Comprehensive Audit Log** — Immutable compliance journal tracking all entity CRUD events.
- **Role-Based Access Control** — Three roles: **Admin**, **Fleet Manager**, **Driver** — each with their own dashboard and route guards.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Angular 18 (Standalone Components, Reactive Forms, RxJS) |
| Styling | SCSS with custom design tokens |
| Maps | Leaflet.js |
| Backend | Node.js + Express |
| Real-Time | Socket.io (WebSocket + polling fallback) |
| Database | PostgreSQL with PL/pgSQL stored procedures & triggers |
| PDF Generation | pdfkit |
| Auth | JWT (`jsonwebtoken` + `bcryptjs`) |
| Security | `helmet`, `express-rate-limit`, `compression` |
| Demo DB | `pg-mem` (in-memory PostgreSQL fallback for zero-config demo) |

---

## Quick Start (Zero Config — No PostgreSQL Required)

```bash
# Clone
git clone https://github.com/SudeepKagi/FleetSync.git
cd FleetSync

# Backend — uses in-memory pg-mem database automatically
cd server
npm install
npm start          # runs on http://localhost:3000

# Frontend (new terminal)
cd client
npm install
npm start          # runs on http://localhost:4200
```

> **No `.env` needed for local demo.** The backend detects no `DATABASE_URL` and auto-initializes with `pg-mem` + seed data.

---

## Production Setup (Real PostgreSQL)

```bash
cd server
cp .env.example .env
# Edit .env: set DATABASE_URL, JWT_SECRET, NODE_ENV=production, CORS_ORIGIN
npm run db:migrate   # runs all migrations against real PostgreSQL
npm start
```

---

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@fleetsync.com` | `Password123!` |
| **Fleet Manager** | `manager@fleetsync.com` | `Password123!` |
| **Driver** | `marcus@fleetsync.com` | `Password123!` |

These credentials are seeded by `migrations/003_seed.sql` and displayed on the login page as 1-click demo chips.

---

## Project Structure

```
FleetSync/
├── client/                  # Angular 18 frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/        # Auth service, JWT interceptor, route guards
│   │   │   ├── features/    # Page components (dashboard, vehicles, drivers, etc.)
│   │   │   └── shared/      # Sidebar, layout, footer components
│   │   ├── environments/    # environment.ts (dev) / environment.prod.ts (prod)
│   │   └── styles.scss      # Global SCSS design tokens
│   └── angular.json
│
├── server/                  # Node.js + Express backend
│   ├── src/
│   │   ├── config/          # db.js — PostgreSQL pool or pg-mem fallback
│   │   ├── controllers/     # Route handler functions
│   │   ├── middleware/       # JWT auth middleware, role guard
│   │   ├── routes/          # Express routers
│   │   ├── sockets/         # Socket.io gateway + GPS location simulator
│   │   └── scripts/         # migrate.js — runs SQL migrations on real DB
│   ├── migrations/
│   │   ├── 001_init_schema.sql         # All table definitions
│   │   ├── 002_triggers_and_procedures.sql  # PL/pgSQL stored procedures (authoritative)
│   │   └── 003_seed.sql                # Demo users, vehicles, drivers, seed data
│   └── .env.example
│
├── vercel.json              # Vercel config for frontend deployment
└── README.md
```

---

## Architecture Notes

### Two implementations of stored procedures
The maintenance logic exists in two forms — both are intentional:

1. **`server/migrations/002_triggers_and_procedures.sql`** — The authoritative PL/pgSQL implementation. Used in production with a real PostgreSQL database.
2. **`server/src/config/db.js`** (JS fallback in `pg-mem`) — A plain JavaScript approximation used only when no `DATABASE_URL` is set. This lets anyone clone the repo and run it without configuring a database.

### Socket.io Rooms
- **`managers` room** — All admin/fleet_manager users join this room on login. Real-time alerts for severe damage and GPS updates broadcast here.
- **`driver:{id}` room** — Each driver has a private room for driver-specific events.

---

## Backend Verification

```bash
cd server
node src/test-endpoints.js
```

Runs a sequential HTTP test suite verifying all endpoints with real JWT auth:
- Login (admin + driver), Dashboard Stats, Vehicles, GPS Locations, Predictive Service Date, Geofence, PDF Generation, Audit Log, Driver assigned vehicle.

---

## Deployment

**Frontend** → Vercel (configured via `vercel.json`)  
**Backend** → Render.com (`https://fleetsync-hytl.onrender.com`)

Environment variables required on Render:
- `DATABASE_URL` — Neon/Supabase/Render PostgreSQL connection string
- `JWT_SECRET` — Strong random secret (32+ chars)
- `NODE_ENV=production`
- `CORS_ORIGIN` — Frontend domain (e.g. `https://your-app.vercel.app`)
- `PORT` — Set automatically by Render

---

## License
MIT — Built as a college engineering capstone project.
