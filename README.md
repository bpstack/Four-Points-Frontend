# Four Points - Hotel Property Management System

**[Live Demo](https://four-points.stackbp.es)**

**Demo Credentials:**

```
Username: demo
Password: demo987654
```

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js_15-black?style=flat&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React_19-61DAFB?style=flat&logo=react&logoColor=black)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green.svg)

A comprehensive, full-stack **Hotel Management System** built from scratch after 15+ years of hotel reception experience. I got tired of slow, clunky, overpriced software that hotels are forced to use. So I built my own.

> **Note**: This repository contains only the frontend. The backend API is private.

---

## Preview

![Dashboard Preview](./public/screenshots/dashboard-black.png)

<details>
<summary>More Screenshots</summary>

| Groups Module                                    | Parking Status                               |
| ------------------------------------------------ | -------------------------------------------- |
| ![Groups](./public/screenshots/groups-black.png) | ![Parking](./public/screenshots/parking.png) |

| Cashier Shifts                               | Logbooks                                       |
| -------------------------------------------- | ---------------------------------------------- |
| ![Cashier](./public/screenshots/cashier.png) | ![Logbooks](./public/screenshots/logbooks.png) |

| Desktop View                                 | Mobile View                                |
| -------------------------------------------- | ------------------------------------------ |
| ![Desktop](./public/screenshots/desktop.png) | ![Mobile](./public/screenshots/mobile.png) |

</details>

---

## The Stack

| Technology                | Purpose                                  |
| ------------------------- | ---------------------------------------- |
| **Next.js 16**            | React framework (App Router + Turbopack) |
| **React 19**              | UI library (latest)                      |
| **TypeScript 5.7**        | Type-safe development                    |
| **TailwindCSS 3.4**       | Utility-first styling                    |
| **NextUI**                | Component library (Tailwind-based)       |
| **HeadlessUI**            | Unstyled accessible components           |
| **Heroicons**             | SVG icon library                         |
| **Zustand**               | Lightweight state management             |
| **TanStack Query v5**     | Server state, caching & mutations        |
| **next-intl**             | Internationalization (EN/ES)             |
| **next-themes**           | Dark/Light mode with system detection    |
| **Framer Motion**         | Smooth animations & transitions          |
| **React Hook Form + Zod** | Form handling with schema validation     |
| **Recharts**              | Data visualization & charts              |
| **xlsx (SheetJS)**        | Excel file generation & export           |
| **pdf-lib**               | PDF document generation                  |
| **pdfjs-dist**            | PDF viewing & rendering                  |
| **react-day-picker**      | Date selection components                |
| **date-fns**              | Date manipulation utilities              |
| **react-hot-toast**       | Toast notifications                      |
| **react-icons**           | Icon library (multiple sets)             |
| **use-debounce**          | Input debouncing                         |
| **uuid**                  | Unique ID generation                     |
| **js-cookie**             | Cookie management                        |
| **clsx + tailwind-merge** | Conditional class utilities              |

---

## What I Built

### Core Modules

| Module             | Description                                                                                                                      |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| **Authentication** | JWT auth with access/refresh tokens, role-based access (admin, receptionist, maintenance, group-admin), avatar upload            |
| **Dashboard**      | KPIs, quick actions, activity feed, important alerts                                                                             |
| **Groups**         | Hotel group reservations with contacts, rooms, payments tracking, status workflow, complete audit history                        |
| **Parking**        | Multi-level parking management, bookings with unique codes, check-in/out, rates, analytics                                       |
| **Logbooks**       | Digital shift notes with priority levels, comments, read tracking, department organization. Tracked: who writes, when, who reads |
| **Cashier**        | Daily cash management with 4 shifts, denomination counting, electronic payments, vouchers, daily reports                         |
| **Maintenance**    | Work order tracking with custom IDs, image uploads, status workflow, assignment to staff/contractors                             |
| **Blacklist**      | Guest incident records with severity levels, document verification, image gallery                                                |
| **Conciliation**   | Daily room count reconciliation between Reception and Housekeeping                                                               |
| **Backoffice**     | Invoice & supplier management with PDF uploads, validation workflow, monthly summaries                                           |
| **Messaging**      | Internal communication system with direct messages and group chats                                                               |
| **Notifications**  | Multi-module alert system with priority levels, scheduled delivery, email integration                                            |

### Special Features

| Feature                  | Description                                                     |
| ------------------------ | --------------------------------------------------------------- |
| **Internationalization** | Full English and Spanish support with 19 translation namespaces |
| **Dark/Light Mode**      | Complete theme support with system preference detection         |
| **Role-Based Access**    | 4 roles with granular permissions per module                    |
| **Real-time Updates**    | Live notifications, unread counters, activity feeds             |
| **Responsive Design**    | Mobile-first approach, works on all devices                     |
| **Demo Mode**            | Restricted operations for public deployments                    |

---

## Schedule Module (In Development)

> Currently being developed on a separate branch

Automated staff scheduling system featuring a **hybrid generation engine** that combines a custom algorithm with optional AI optimization.

### Generation Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   SCHEDULE GENERATION                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  PHASE 1: Algorithm Engine (50 iterations)                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 10 modular phases executed in sequence:             │   │
│  │ • Initialize Matrix → Apply Constraints             │   │
│  │ • Apply Employee Rules → Assign Night Blocks        │   │
│  │ • Enforce Post-Night Rest → Assign Rotating Shifts  │   │
│  │ • Assign Weekly Offs → Validate Coverage            │   │
│  │ • Assign PI Support → Repair Small Blocks           │   │
│  │ • Final Validation                                  │   │
│  │                                                     │   │
│  │ Keeps best result (minimum constraint violations)   │   │
│  └─────────────────────────────────────────────────────┘   │
│                          ↓                                  │
│  PHASE 2: AI Optimization (single pass, optional)          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ┌─────────┐   ┌─────────┐   ┌─────────┐           │   │
│  │  │ Claude  │ OR│ OpenAI  │ OR│ Ollama  │           │   │
│  │  │(Sonnet) │   │ (GPT)   │   │ (Local) │           │   │
│  │  └─────────┘   └─────────┘   └─────────┘           │   │
│  │                                                     │   │
│  │  • Analyzes remaining violations                   │   │
│  │  • Proposes targeted swaps                         │   │
│  │  • Validates each change doesn't break coverage    │   │
│  │  • Applies only safe improvements                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                          ↓                                  │
│  PHASE 3: Re-validation & Final Result                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Key Features

| Feature                     | Description                                                           |
| --------------------------- | --------------------------------------------------------------------- |
| **Modular Phase System**    | 11 independent, testable phases executed in configurable order        |
| **Constraint Management**   | Vacations, sick leave, training, holidays, employee requests          |
| **Business Rules**          | Min/max consecutive work days, 48h rest periods, night block rotation |
| **Coverage Validation**     | Ensures minimum staff per shift (Morning/Afternoon/Night)             |
| **Employee-Specific Rules** | Custom preferences per employee (preferred shifts, max shifts/month)  |
| **AI Provider Selection**   | Choose between Claude, OpenAI, Ollama, or algorithm-only              |
| **Real-time Validation**    | Instant feedback on constraint violations                             |
| **Excel Export**            | Compatible with existing spreadsheet workflows                        |

#### Supported Shift Types

| Code | Type       | Description                   |
| ---- | ---------- | ----------------------------- |
| M    | Morning    | Morning shift                 |
| T    | Afternoon  | Afternoon shift               |
| N    | Night      | Night shift (4-6 consecutive) |
| L    | Day Off    | Weekly rest day               |
| V    | Vacation   | Approved vacation             |
| B    | Holiday    | Company holiday               |
| IT   | Sick Leave | Medical leave                 |
| FO   | Training   | Training day                  |
| PI   | Support    | Backup when understaffed      |

---

## Special Features

| Feature                  | Description                                                     |
| ------------------------ | --------------------------------------------------------------- |
| **Internationalization** | Full English and Spanish support with 19 translation namespaces |
| **Dark/Light Mode**      | Complete theme support with system preference detection         |
| **Role-Based Access**    | 4 roles with granular permissions per module                    |
| **Real-time Updates**    | Live notifications, unread counters, activity feeds             |
| **Responsive Design**    | Mobile-first approach, works on all devices                     |
| **Demo Mode**            | Restricted operations for public deployments                    |

---

## Data Export & Documents

### Excel Export (xlsx)

| Module           | Export Feature                                  |
| ---------------- | ----------------------------------------------- |
| **Cashier**      | Daily shift reports with denomination breakdown |
| **Parking**      | Booking history, analytics data                 |
| **Groups**       | Reservation lists, payment summaries            |
| **Conciliation** | Monthly room count reports                      |

### PDF Generation (pdf-lib)

| Module         | PDF Feature               |
| -------------- | ------------------------- |
| **Cashier**    | Daily cash reports        |
| **Groups**     | Reservation confirmations |
| **Backoffice** | Invoice summaries         |

### PDF Viewing (pdfjs-dist)

- In-app PDF preview for uploaded invoices
- Thumbnail generation for document lists
- Full document viewer with zoom controls

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/bpstack/four-points-frontend.git
cd four-points-frontend

# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env.local

# Start development server
pnpm dev
```

### Environment Variables

Create a `.env.local` file based on `.env.example`:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:4000

# App Configuration
NEXT_PUBLIC_APP_NAME=Four Points
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Feature Flags
NEXT_PUBLIC_DEMO_MODE=true
```

> **Note**: The backend API is required for full functionality.

---

## Project Structure

```
frontend/
├── app/
│   ├── (auth)/              # Authentication pages
│   ├── api/                 # API routes (Next.js)
│   ├── components/          # React components
│   │   ├── auth/
│   │   ├── blacklist/
│   │   ├── cashier/
│   │   ├── conciliation/
│   │   ├── dashboard/
│   │   ├── groups/
│   │   ├── layout/
│   │   ├── logbooks/
│   │   ├── maintenance/
│   │   ├── notifications/
│   │   ├── parking/
│   │   ├── profile/
│   │   └── ...
│   ├── dashboard/           # Dashboard pages
│   ├── i18n/                # Internationalization config
│   ├── lib/                 # Utilities & hooks
│   │   ├── auth/
│   │   ├── helpers/
│   │   └── [module]/
│   ├── stores/              # Zustand stores
│   └── ui/                  # Base UI components
├── messages/
│   ├── en/                  # English translations (19 files)
│   └── es/                  # Spanish translations (19 files)
├── public/
│   └── screenshots/
└── ...
```

---

## State Management

| Type         | Tool           | Usage                              |
| ------------ | -------------- | ---------------------------------- |
| Server state | TanStack Query | Data fetching, caching, mutations  |
| Client state | Zustand        | UI state (selected items, filters) |

### React Query Modules

BackOffice, Parking, Maintenance, Logbooks, Notifications, Groups (with SSR prefetch)

---

## Authentication

Uses **HttpOnly cookies** for JWT tokens (XSS-protected). No localStorage.

```
Login → Access Token (15min) + Refresh Token (7 days)
         ↓
Request fails 401 → Auto-refresh via cookie
         ↓
Refresh expires → Redirect to /login
```

### Key Features

- Automatic token refresh
- Role-based access (admin, receptionist, maintenance, group-admin)
- Centralized `apiClient` with `credentials: 'include'`

---

## Demo Mode

This application includes a **Demo Mode** for safe public deployment. Demo users can **view everything** but have **limited write access**.

### Allowed Operations

| Module          | Allowed Actions    |
| --------------- | ------------------ |
| **Auth**        | Logout             |
| **Parking**     | Create bookings    |
| **Logbooks**    | Add comments       |
| **Maintenance** | Create work orders |

All other write operations are blocked with a friendly message.

---

## Scripts

```bash
pnpm dev        # Development (Turbopack)
pnpm build      # Production build
pnpm start      # Start production
pnpm lint       # ESLint
pnpm format     # Prettier
```

---

## Backend

This repository contains **only the frontend** application. The backend is a separate private Express 5 REST API.

See `PROJECT.md` for backend architecture details.

---

## License

This is a personal portfolio project. The code is visible for demonstration and recruitment purposes.

**What you can do:**

- View the code
- Learn from it
- Use as reference for your own projects

**What you cannot do:**

- Use commercially without permission
- Redistribute as your own work

© 2025 Salvador Pérez (bpstack)

---

## Author

**Salvador Pérez**

- GitHub: [@bpstack](https://github.com/bpstack)
- Email: contact.bpstack@gmail.com

---

<p align="center">
  Made with Next.js, TypeScript, and TailwindCSS
</p>
