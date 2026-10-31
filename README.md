# Brightloop Software — Subscription Management System

A production-grade, enterprise-ready full-stack Subscription Management System built with **Node.js, Express.js, TypeScript, MySQL (via Prisma ORM), React.js, Vite, and Tailwind CSS**.

---

## 🌟 Architecture & Core Features

### 1. Database & Prisma Schema (`backend/prisma/schema.prisma`)
- **User Model & RBAC**: Roles: `ADMIN`, `STAFF`, `CUSTOMER`. Secure bcrypt hashing (salt rounds: 12), strict password regex enforcement, and crypto-signed password recovery tokens.
- **Product & Brand Variants**: Multi-brand catalogue support (e.g., Odoo Ecosystem, Brightloop Suite) with SKU definitions, price adjustments, and dynamic JSON attributes.
- **Plan Model**: Daily, weekly, monthly, and annual billing frequencies (`billingCycleDays`), minimum order quantities, availability windows, and automated lifecycle policies (`autoCloseOnExpiry`, `canPause`, `autoRenew`).
- **Subscription Lifecycle Engine**: Strict state machine moving through:
  $$\text{DRAFT} \longrightarrow \text{QUOTATION} \longrightarrow \text{CONFIRMED} \longrightarrow \text{ACTIVE} \longrightarrow \text{CLOSED / CANCELLED}$$
  with pause/resume capabilities and full immutable transition logging in `SubscriptionLifecycleLog`.
- **Invoices & Billing**: Automated billing generation from active subscriptions, 18% configurable tax calculations, payment terms (`IMMEDIATE`, `NET_15`, `NET_30`, `NET_60`), status lifecycle (`DRAFT` &rarr; `CONFIRMED` &rarr; `PAID` / `OVERDUE`), and on-the-fly **PDFKit PDF generation**.
- **Discount Engine**: Fixed and percentage-based admin coupons with minimum quantity, minimum subtotal, percentage discount ceilings, expiration dates, and usage limits.
- **Payment & Reconciliation**: Multi-method recording (`CREDIT_CARD`, `BANK_TRANSFER`, `UPI`, `RAZORPAY`, `STRIPE`, `CASH`) with atomic transactions that deduct balance due and auto-mark invoices as `PAID`.

---

### 2. Modular Backend (`backend/src/modules/`)
Organized by strict domain boundaries:
```
backend/src/
├── config/             # Typed environment variables and Prisma singleton
├── middlewares/        # JWT auth guard, RBAC (requireRole), Zod validation, error handler
├── modules/
│   ├── auth/           # JWT issue, bcrypt hashing, password reset, RBAC
│   ├── products/       # Products & brand variants CRUD
│   ├── plans/          # Billing frequency calculations & pricing plans
│   ├── discounts/      # Discount rule verification & application algorithm
│   ├── subscriptions/  # Quotation workflow, quote-to-subscription conversion, lifecycle
│   ├── invoices/       # Automated billing generation, PDFKit PDF generation
│   ├── payments/       # Atomic invoice reconciliation & Razorpay webhook integration
│   ├── analytics/      # Concurrent aggregate queries (<2s SLA) for MRR, ARR, and overdue metrics
│   └── jobs/           # Node-cron background workers (billing, reminders, auto-close, overdue)
├── types/              # Express request user typing extensions
├── utils/              # Standardized API response formatters
├── app.ts              # Express application setup, Helmet, CORS, Morgan logger
└── server.ts           # Server startup, graceful shutdown, cron initialization
```

---

### 3. Background Jobs (`node-cron`)
Automated daily background tasks:
1. **Daily Automated Billing Cycle (`0 2 * * *`)**: Identifies active subscriptions due on `nextBillingDate`, automatically generates new `Invoice`, and advances next billing date.
2. **Renewal & Expiry Reminders (`0 8 * * *`)**: Dispatches renewal notices for subscriptions expiring within 7 days.
3. **Expired Subscriptions Closure (`0 0 * * *`)**: Auto-closes non-renewing subscriptions that reach their expiration date.
4. **Overdue Invoice Tracker (`0 */6 * * *`)**: Monitors unpaid confirmed invoices past due terms and marks them as `OVERDUE`.

---

### 4. Frontend Structure (`frontend/src/`)
- **React 18 + Vite + TypeScript + Tailwind CSS**
- **Authentication Context (`AuthContext.tsx`)**: Global session management, JWT storage, and role-based redirecting.
- **Separated Layouts & Portals**:
  - **Admin Dashboard (`/admin`)**: Executive KPI cards, real-time query latency badge, subscription pipeline breakdown, and manual background task triggers.
  - **Customer Portal (`/customer`)**: Self-serve subscription management, outstanding balance summary, PDF invoice downloads, and product catalog ordering.
  - **Staff Panel (`/staff`)**: Sales operations pipeline, quotation creation, and quote-to-subscription conversion tools.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+ (tested on Node v24)
- **MySQL Database** (local instance or cloud e.g. PlanetScale, AWS RDS, Docker)

### 1. Configure Database Connection
Edit `backend/.env` with your MySQL database credentials:
```env
DATABASE_URL="mysql://root:your_mysql_password@localhost:3306/brightloop_subscriptions"
PORT=5000
JWT_SECRET="your_production_secret_key"
FRONTEND_URL="http://localhost:5173"
BILLING_TAX_PERCENT=18.00
```

### 2. Generate Prisma Client & Run Migrations
```bash
# Push schema to MySQL database
npm run prisma:migrate

# Seed demo users, products, plans, and discounts
npm run prisma:seed
```

### 3. Start Development Servers
From the root workspace directory:
```bash
# Start Backend (Express + TypeScript on port 5000)
npm run dev:backend

# Start Frontend (React + Vite + Tailwind on port 5173)
npm run dev:frontend
```

---

## 🔑 Pre-Seeded Demo Accounts

Password for all pre-seeded accounts: **`Brightloop@2026`**

| Role | Email | Access |
|---|---|---|
| **Admin** | `admin@brightloop.com` | Full executive dashboard, lifecycle overrides, products, plans, discounts, manual cron triggers |
| **Staff** | `staff@brightloop.com` | Sales operations, quotation dispatching, and quote-to-subscription conversion |
| **Customer** | `customer@acmecorp.com` | Customer portal, subscription self-service, invoice PDF downloads, catalog |

---

## 📡 Key API Endpoints

- `POST /api/v1/auth/login` — Sign in and receive JWT token
- `POST /api/v1/auth/register` — Create account with password strength enforcement
- `GET /api/v1/analytics/overview` — High-performance KPIs and MRR calculations (<2s response time)
- `GET /api/v1/subscriptions` — Filter subscriptions by status, customer, or search
- `POST /api/v1/subscriptions/:id/send-quote` — DRAFT &rarr; QUOTATION
- `POST /api/v1/subscriptions/:id/accept-quote` — QUOTATION &rarr; CONFIRMED
- `POST /api/v1/subscriptions/:id/activate` — CONFIRMED &rarr; ACTIVE
- `GET /api/v1/invoices/:id/pdf` — Stream PDFKit-rendered invoice PDF
- `POST /api/v1/payments` — Record payment and auto-reconcile invoice balance
- `POST /api/v1/jobs/run-billing` — Manually trigger automated billing cycle
