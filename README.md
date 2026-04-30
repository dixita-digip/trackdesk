# TrackDesk

TrackDesk is a modern work management and time-tracking platform designed for engineering and operations teams.  
It combines project execution visibility, task lifecycle management, employee accountability, and desktop-based time capture in one unified system.

---

## Overview

TrackDesk includes three integrated applications:

- **Web Application** (`React + Vite`) for day-to-day operations and reporting
- **Backend API** (`Node.js + Express`) for business logic and persistence
- **Desktop Tracker** (`Electron`, Windows) for accurate timer-based work logging

This architecture supports both centralized management and practical employee workflows.

---

## Core Capabilities

### Work Management
- End-to-end management for **Systems**, **Projects**, **Tasks**, and **Employees**
- Role-aware experience for **Admin**, **Manager**, and **Employee**
- Structured task lifecycle with status progression and assignment controls

### Time Tracking
- Desktop timer start/stop synced to central API
- Session-based tracking linked to projects and tasks
- Automatic task time aggregation for productivity insights

### Reporting & Visibility
- Management dashboards with progress indicators
- Timesheet and summary report generation
- CSV export support for downstream analysis

### Notifications & Activity
- In-app notification center
- Bulk actions (mark read / delete)
- Activity logging for major system events

### Security & Access
- Login and password-change workflows
- First-login password reset support
- Sensitive server credentials handled through environment configuration

---

## Technology Stack

- **Frontend:** React, Vite, MUI
- **Backend:** Node.js, Express
- **Database/Persistence:** Supabase
- **Desktop App:** Electron + electron-builder
- **Email (optional):** SMTP (e.g., SendGrid)

---

## API Highlights

Base path: `/api`

### Tracker endpoints
- `POST /tracker/timer/start`
- `POST /tracker/timer/stop`
- `POST /tracker/sessions`
- `GET /tracker/sessions`
- `GET /tracker/download` (serves latest `.exe`/`.msi` installer)

Installer download source (latest file wins):
- `server/downloads`
- `desktop-tracker/dist`

---

## Project Structure

- `src/` - Web client
- `server/` - API server
- `desktop-tracker/` - Windows desktop tracker

---

## Environment Configuration

1. Copy `.env.example` to `.env`
2. Configure required values:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Configure optional settings as needed:
   - SMTP values (`SMTP_*`) for employee onboarding emails
   - Admin defaults (`ADMIN_*`)
   - App login URL (`APP_LOGIN_URL`)

Reference file:
- `server/env.example` (minimal server-side environment template)

---

## Local Development

### Install dependencies

```bash
npm install
npm install --prefix server
npm install --prefix desktop-tracker
```

### Start web app + API

```bash
npm run dev
```

- Web: `http://localhost:5173`
- API: `http://localhost:5000`

### Run desktop tracker (development)

```bash
npm start --prefix desktop-tracker
```

Default desktop API base URL: `http://localhost:5000/api`

---

## Build & Distribution (Desktop Tracker)

Build Windows installer:

```bash
npm run build:win --prefix desktop-tracker
```

Build output directory:
- `desktop-tracker/dist`

For web download integration, keep installer files (`.exe`/`.msi`) in either:
- `desktop-tracker/dist` or
- `server/downloads`

The endpoint `GET /api/tracker/download` automatically serves the latest installer.

---

## Delivery Notes

- Do not commit large installer archives/binaries directly to GitHub if they exceed 100 MB.
- Publish release artifacts externally or use Git LFS where binary versioning is required.
- Keep `.env` out of version control; commit only `.env.example`.

---

## License

MIT (update if your organization requires a different license model).
