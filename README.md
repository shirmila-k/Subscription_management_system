# Brightloop Software — Subscription Management System

Enterprise-grade, modular subscription billing and contract lifecycle platform built with **Node.js, Express.js, TypeScript, MySQL (via Prisma ORM), Tailwind CSS, and React.js**.

---

## 🏛 System Architecture & Modular Layout

```
subscription_management/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma            # MySQL Prisma schema (Users, Products, Plans, Subscriptions, Invoices, Payments, Discounts)
│   │   └── seed.ts                  # Database seeder (Admin, Staff, Customer, sample ERP products & plans)
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.ts               # Environment configuration
│   │   │   └── prisma.ts            # Prisma client singleton
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.ts   # JWT authentication & request decorator
│   │   │   ├── rbac.middleware.ts   # Role-Based Access Control (ADMIN, STAFF, CUSTOMER)
│   │   │   └── error.middleware.ts  # Centralized error handler
│   │   ├── modules/
│   │   │   ├── auth/                # JWT auth, bcrypt hashing, password reset tokens, RBAC
│   │   │   ├── products/            # Admin CRUD for products & brand variants (Odoo style)
│   │   │   ├── plans/               # Pricing plans, billing cadence, and lifecycle rules
│   │   │   ├── subscriptions/       # Quotation templates, quote-to-subscription conversion, state transitions
│   │   │   ├── invoices/            # Automated billing cycle invoice generation, 18% tax, PDFKit engine
│   │   │   ├── payments/            # Razorpay / Stripe payment recording, signature verification, invoice reconciliation
│   │   │   ├── discounts/           # Promo vouchers, minimum quantity rules, date & usage constraints
│   │   │   ├── analytics/           # Sub-2-second summary telemetry (MRR, ARR, overdue receivables)
│   │   │   └── jobs/                # Node-cron background jobs (automated billing, reminders, auto-closures)
│   │   ├── utils/
│   │   │   ├── pdfGenerator.ts      # Vector PDF invoice generator via PDFKit
│   │   │   ├── response.ts          # Standardized API response formatters
│   │   │   └── errors.ts            # Typed operational HTTP error classes
│   │   ├── app.ts                   # Express app setup, security middlewares, routes
│   │   └── server.ts                # Server bootstrap, cron scheduler startup, graceful termination
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/              # Navbar, Sidebar, StatCard, Badge, Modal
│   │   ├── context/                 # AuthContext (JWT session, RBAC role state, 1-click sandbox switcher)
│   │   ├── layouts/                 # AdminLayout, CustomerLayout, StaffLayout, AuthLayout
│   │   ├── pages/
│   │   │   ├── admin/               # Dashboard, Subscriptions, Products, Plans, Invoices, Discounts
│   │   │   ├── customer/            # CustomerPortal, CustomerCatalog, CustomerInvoices
│   │   │   ├── staff/               # StaffPanel (Quotation approval queue)
│   │   │   └── auth/                # LoginPage, RegisterPage
│   │   ├── services/                # ApiClient with JWT injection and PDF stream downloader
│   │   ├── types/                   # Unified TypeScript schemas matching Prisma models
│   │   ├── App.tsx                  # Dynamic multi-role router
│   │   ├── main.tsx                 # React DOM entry point
│   │   └── index.css                # Tailwind directives & glassmorphism theme
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
└── README.md
```

---

## 🗄 1. Database & Prisma Schema (`schema.prisma`)

Provider: **MySQL**

### Key Models & Relationships:
1. **User**: Roles `ADMIN`, `STAFF`, `CUSTOMER`. Strict password hashing (bcrypt), reset tokens, and company metadata.
2. **Product & ProductVariant**: Brand additions (e.g. Odoo brand accessories/attributes), SKU uniqueness, and extra variant costs.
3. **Plan**: Billing frequencies (`DAILY`, `WEEKLY`, `MONTHLY`, `YEARLY`), currency, minimum quantities, availability dates, and lifecycle flags:
   - `autoClose` (closes on expiration/non-payment after grace period)
   - `autoRenew` (auto-renews contract period)
   - `pauseAllowed` (permits customers/staff to pause subscriptions)
   - `trialPeriodDays` & `gracePeriodDays`
4. **Subscription**: Lifecycle states:
   $$\text{DRAFT} \longrightarrow \text{QUOTATION} \longrightarrow \text{CONFIRMED} \longrightarrow \text{ACTIVE} \longrightarrow \text{CLOSED}$$
   *(Includes `PAUSED` state).* Tracks quantity, discounts applied, next billing date, and payment terms (`IMMEDIATE`, `NET15`, `NET30`, `NET60`).
5. **Invoice**: States `DRAFT` $\rightarrow$ `CONFIGURED/CONFIRMED` $\rightarrow$ `PAID` / `OVERDUE`. Includes 18% standard tax computation, line item breakdown, and automatic generation from subscriptions.
6. **Payment**: Supports `RAZORPAY`, `STRIPE`, `CREDIT_CARD`, `BANK_TRANSFER`. Verifies gateway signatures and automatically marks invoices as `PAID` upon full reconciliation.
7. **Discount**: Percentage or fixed amounts, minimum quantity rules, minimum purchase thresholds, usage limits, and date validity checks.

---

## ⚡ 2. Modular Backend Architecture

All business logic is isolated within domain modules under `src/modules/`:
- **Auth**: RBAC middleware (`authorize('ADMIN', 'STAFF')`), strict regex password validation, and signed JWTs.
- **Subscriptions Service**: Calculates next billing cycle dates, quotation expiry, quantity validation, and converts quotations into active subscriptions while triggering initial invoices.
- **Invoices Service & PDFKit**: Generates downloadable PDF invoices with brand headers, line items, and tax calculations.
- **Analytics Service**: High-performance indexed aggregations for **MRR (Monthly Recurring Revenue)**, **ARR**, overdue receivables, and status pipelines under 2-second target latencies.
- **Background Cron Jobs (`src/modules/jobs/cronScheduler.ts`)**:
  - `00:05 Daily`: Automated billing day invoice generation for subscriptions due.
  - `08:00 Daily`: Scans for contracts expiring in the next 7 days and dispatches renewal reminders.
  - `01:00 Daily`: Auto-closes expired subscriptions whose plan mandates `autoClose`.
  - `Every 6 Hours`: Scans confirmed/draft invoices past their due date and transitions them to `OVERDUE`.

---

## 🎨 3. Frontend Architecture

Built with **React 18 + Vite + TypeScript + Tailwind CSS**:
- **Role-Based Views**:
  - **Admin Dashboard**: Real-time telemetry, MRR/ARR cards, lifecycle state tables, product/plan configurator, and voucher manager.
  - **Customer Portal**: Active subscriptions view, next billing dates, pause/resume controls, coupon-enabled catalog, and Pay Now invoice settlement with PDF download.
  - **Staff Panel**: Dedicated queue for reviewing incoming quotation requests and confirming/activating orders.
- **1-Click Sandbox Switcher**: Top navbar and login screen offer 1-click evaluation shortcuts to switch instantly between Admin, Staff, and Customer sessions.

---

## 🚀 Quickstart Guide

### 1. Backend Setup
```bash
cd backend
npm install

# Configure your MySQL connection in .env
cp .env.example .env

# Generate Prisma client and migrate database
npx prisma generate
npx prisma migrate dev --name init

# Seed default admin, staff, customer, products, and plans
npm run prisma:seed

# Start the dev server
npm run dev
```
Backend runs at `http://localhost:5000` (Health check: `http://localhost:5000/health`).

### 2. Frontend Setup
```bash
cd ../frontend
npm install

# Start Vite dev server
npm run dev
```
Frontend runs at `http://localhost:5173`.
