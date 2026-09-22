# 📦 ERP — Inventory Management System

A full-stack **Enterprise Resource Planning (ERP)** system for managing institutional inventory — purpose-built for polytechnic colleges to track store stock, distribute items to departments, log usage, and maintain a complete audit trail.

---

## ✨ Features

### 🔐 Authentication & Authorization
- JWT-based authentication with access & refresh tokens
- Role-based access control (RBAC) with 7 distinct roles
- Secure password hashing with bcrypt
- Protected routes on both frontend and backend

### 🏪 Central Store Management
- **Stock Entry** — Record incoming items with vendor details, bill images, and amounts
- **Stock Tracking** — Real-time stock levels with LOW / CRITICAL / OUT_OF_STOCK alerts
- **Distribution** — Distribute items from the central store to any department
- **Entry History** — Searchable, filterable log of all store entries
- **Reports** — Visual reports with charts for stock analysis

### 🏢 Department Management
- **Department Stock** — Each department tracks its own inventory
- **Incoming Items** — Confirm receipt of items distributed from the store
- **Usage Logging** — Log item usage with categories (Teaching, Lab, Admin, etc.)
- **Usage History** — Full history of all usage logs per department
- **Department Reports** — Department-level analytics and reporting

### 📊 Admin & Analytics
- **Dashboard** — At-a-glance KPIs and overview metrics
- **Advanced Analytics** — Cross-department charts and trend analysis (Recharts)
- **Verification Center** — Confirm distribution receipts and resolve discrepancies
- **Audit Trail** — Immutable edit logs for every data modification (who, what, when, why)
- **User Management** — Create, update, activate/deactivate users (Super Admin only)
- **Settings** — Profile management & password changes

---

## 📸 Application Screenshots

### 01. Authentication & Sign In
Secure role-based login portal with validation and error handling.
![01 - Sign In Page](./Images/01.png)

### 02. Super Admin Dashboard
Central executive dashboard displaying inventory KPIs, low stock alerts, and quick action shortcuts.
![02 - Super Admin Dashboard](./Images/02.png)

### 03. Store Management — Add Stock Entry
Form to register new stock receipts with vendor details, bill metadata, and invoice document uploads.
![03 - Add Stock Entry](./Images/03.png)

### 04. Audit Trail
Comprehensive tamper-evident log capturing all system modifications, field changes, and audit reasons.
![04 - Audit Trail](./Images/04.png)

### 05. Account & System Settings
User preference management including profile updates, password change, and notification settings.
![05 - Settings](./Images/05.png)

### 06. User Management
Administrator panel to invite users, assign department roles, and toggle account activation status.
![06 - User Management](./Images/06.png)

### 07. Verification Center
Stock reconciliation console to audit and ensure consistency between central store records and departmental stocks.
![07 - Verification Center](./Images/07.png)

---

## 🏗️ Tech Stack

| Layer        | Technology                                                           |
| ------------ | -------------------------------------------------------------------- |
| **Frontend** | React 18, TypeScript, Vite, TailwindCSS, React Router v6             |
| **State**    | TanStack React Query, React Context API                              |
| **Forms**    | React Hook Form + Zod validation                                     |
| **Charts**   | Recharts                                                             |
| **Icons**    | Lucide React                                                         |
| **Backend**  | Node.js, Express 4, TypeScript                                       |
| **ORM**      | Prisma (with PostgreSQL)                                             |
| **Auth**     | JSON Web Tokens (jsonwebtoken), bcrypt                               |
| **Upload**   | Multer + Sharp (image processing)                                    |
| **Database** | PostgreSQL 15 (via Docker or local install)                          |

---

## 📁 Project Structure

```
ERP - Inventory Management System/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Database schema (10 models)
│   │   └── seed.ts                # Seed data (default users & categories)
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts        # Prisma client singleton
│   │   ├── controllers/           # Request handlers
│   │   │   ├── analytics.controller.ts
│   │   │   ├── audit.controller.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── department.controller.ts
│   │   │   ├── store.controller.ts
│   │   │   └── user.controller.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts            # JWT authentication middleware
│   │   │   ├── errorHandler.ts    # Global error handler
│   │   │   ├── roleCheck.ts       # RBAC middleware
│   │   │   └── upload.ts          # Multer file upload config
│   │   ├── routes/                # Express route definitions
│   │   │   ├── analytics.routes.ts
│   │   │   ├── audit.routes.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── department.routes.ts
│   │   │   ├── store.routes.ts
│   │   │   └── user.routes.ts
│   │   ├── services/              # Business logic layer
│   │   │   ├── analytics.service.ts
│   │   │   ├── audit.service.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── department.service.ts
│   │   │   ├── store.service.ts
│   │   │   └── user.service.ts
│   │   ├── utils/
│   │   │   ├── jwt.ts             # JWT sign/verify helpers
│   │   │   └── validators.ts      # Express-validator rules
│   │   └── index.ts               # Express app entry point
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/              # Login, PrivateRoute
│   │   │   ├── common/            # EditHistoryModal, GlobalSearch, NotificationBell, etc.
│   │   │   ├── layout/            # Layout, Navbar, Sidebar
│   │   │   └── ui/                # Reusable UI primitives (Card, etc.)
│   │   ├── context/
│   │   │   └── AuthContext.tsx     # Global auth state
│   │   ├── hooks/
│   │   │   └── useAuth.ts         # Auth hook
│   │   ├── pages/
│   │   │   ├── admin/             # AdvancedAnalytics, AuditTrail, VerificationCenter
│   │   │   ├── department/        # DepartmentDashboard, Stock, LogUsage, etc.
│   │   │   ├── store/             # StoreDashboard, AddStockEntry, Distribute, etc.
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Settings.tsx
│   │   │   └── Users.tsx
│   │   ├── services/              # Axios API service layer
│   │   │   ├── api.ts             # Axios instance with interceptors
│   │   │   ├── analytics.service.ts
│   │   │   ├── audit.service.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── department.service.ts
│   │   │   ├── store.service.ts
│   │   │   └── user.service.ts
│   │   ├── types/
│   │   │   └── index.ts           # All TypeScript interfaces & types
│   │   ├── App.tsx                # Root component with routing
│   │   ├── main.tsx               # Vite entry point
│   │   └── index.css              # Global styles
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── tsconfig.json
│   └── package.json
│
├── docker-compose.yml             # PostgreSQL container
├── .gitignore
├── LICENSE
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

| Tool                  | Version  | Purpose             |
| --------------------- | -------- | -------------------- |
| **Node.js**           | ≥ 18.x   | Runtime              |
| **npm**               | ≥ 9.x    | Package manager      |
| **Docker** (optional) | ≥ 20.x   | PostgreSQL container |
| **PostgreSQL**        | ≥ 15     | Database (if no Docker) |

### 1. Clone the Repository

```bash
git clone https://github.com/Vaibhav-Waghalkar/ERP---Inventory-Management-System.git
cd "ERP---Inventory-Management-System"
```

### 2. Start the Database

**Option A — Docker (recommended):**

```bash
docker-compose up -d
```

This starts PostgreSQL on port **5433** with:
- User: `erp_user`
- Password: `erp_password`
- Database: `erp_inventory`

**Option B — Local PostgreSQL:**

Create a database manually and update `backend/.env` with your connection string.

### 3. Set Up the Backend

```bash
cd backend
npm install

# Create a .env file (or use the example values)
# DATABASE_URL=postgresql://erp_user:erp_password@localhost:5433/erp_inventory
# JWT_SECRET=your-super-secret-jwt-key-change-in-production
# JWT_REFRESH_SECRET=your-refresh-secret-key
# PORT=5000
# CORS_ORIGIN=http://localhost:5173

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# Seed the database with default users and categories
npm run prisma:seed

# Start the development server
npm run dev
```

The backend will be running at **http://localhost:5000**.

### 4. Set Up the Frontend

```bash
cd frontend
npm install

# Create a .env file (or use the example values)
# VITE_API_URL=http://localhost:5000/api

# Start the development server
npm run dev
```

The frontend will be running at **http://localhost:5173**.

---

## 🔑 Default Login Credentials

All default accounts use the password: **`Admin@123`**

| Role                                 | Email                             |
| ------------------------------------ | --------------------------------- |
| **Super Admin**                      | `admin@rg-polytechnic.in`         |
| **Store Admin**                      | `store@rg-polytechnic.in`         |
| **Dept Admin — Computer Engg.**      | `computer@rg-polytechnic.in`      |
| **Dept Admin — Civil Engg.**         | `civil@rg-polytechnic.in`         |
| **Dept Admin — Electrical Engg.**    | `electrical@rg-polytechnic.in`    |
| **Dept Admin — E&TC Engg.**          | `electronics@rg-polytechnic.in`   |
| **Dept Admin — Mechanical Engg.**    | `mechanical@rg-polytechnic.in`    |

> ⚠️ **Change all default passwords immediately in production!**

---

## 🌐 API Endpoints

### Authentication
| Method | Endpoint                | Description           |
| ------ | ----------------------- | --------------------- |
| POST   | `/api/auth/login`       | Login                 |
| POST   | `/api/auth/register`    | Register (admin only) |
| POST   | `/api/auth/refresh`     | Refresh access token  |
| GET    | `/api/auth/me`          | Get current user      |

### Users
| Method | Endpoint                | Description           |
| ------ | ----------------------- | --------------------- |
| GET    | `/api/users`            | List all users        |
| GET    | `/api/users/:id`        | Get user by ID        |
| PUT    | `/api/users/:id`        | Update user           |
| PATCH  | `/api/users/:id/status` | Toggle active status  |

### Store
| Method | Endpoint                              | Description               |
| ------ | ------------------------------------- | ------------------------- |
| GET    | `/api/store/categories`               | List categories           |
| POST   | `/api/store/categories`               | Create category           |
| GET    | `/api/store/items`                    | List items                |
| POST   | `/api/store/items`                    | Create item               |
| GET    | `/api/store/stock`                    | View stock levels         |
| POST   | `/api/store/entries`                  | Add stock entry           |
| GET    | `/api/store/entries`                  | List store entries        |
| POST   | `/api/store/distributions`            | Distribute items          |
| GET    | `/api/store/distributions`            | List distributions        |

### Department
| Method | Endpoint                              | Description               |
| ------ | ------------------------------------- | ------------------------- |
| GET    | `/api/department/stock`               | View department stock     |
| GET    | `/api/department/incoming`            | View incoming items       |
| POST   | `/api/department/confirm/:id`         | Confirm receipt           |
| POST   | `/api/department/usage`               | Log usage                 |
| GET    | `/api/department/usage`               | View usage history        |

### Analytics & Audit
| Method | Endpoint                | Description           |
| ------ | ----------------------- | --------------------- |
| GET    | `/api/analytics/*`      | Analytics endpoints   |
| GET    | `/api/audit`            | Get audit trail       |

---

## 🗄️ Database Schema

The system uses **10 Prisma models**:

| Model              | Description                                       |
| ------------------- | ------------------------------------------------- |
| `User`             | System users with roles and department assignment   |
| `Category`         | Item categories (Stationery, Electronics, etc.)     |
| `Item`             | Individual inventory items                          |
| `StoreStock`       | Current stock levels in the central store            |
| `StoreEntry`       | Records of items entering the store (with bills)     |
| `DepartmentStock`  | Stock levels per item per department                 |
| `Distribution`     | Records of items distributed to departments          |
| `UsageLog`         | Records of items consumed by departments             |
| `EditLog`          | Immutable audit trail for all data modifications     |

### Enums
- **Role**: `SUPER_ADMIN`, `STORE_ADMIN`, `DEPT_ADMIN_COMPUTER`, `DEPT_ADMIN_CIVIL`, `DEPT_ADMIN_ELECTRICAL`, `DEPT_ADMIN_ELECTRONICS`, `DEPT_ADMIN_MECHANICAL`
- **Department**: `STORE`, `COMPUTER_ENGINEERING`, `CIVIL_ENGINEERING`, `ELECTRICAL_ENGINEERING`, `ELECTRONICS_TELECOMMUNICATION`, `MECHANICAL_ENGINEERING`
- **UsageCategory**: `TEACHING_CLASSROOM`, `LAB_EXPERIMENT`, `STUDENT_DISTRIBUTION`, `ADMINISTRATIVE`, `MAINTENANCE_REPAIRS`, `EVENTS_ACTIVITIES`, `OTHER`

---

## 🛠️ Available Scripts

### Backend (`cd backend`)

| Script              | Command                 | Description                     |
| -------------------- | ---------------------- | ------------------------------- |
| `npm run dev`        | `tsx watch src/index.ts` | Start dev server with hot-reload |
| `npm run build`      | `tsc`                  | Compile TypeScript               |
| `npm start`          | `node dist/index.js`   | Start production server          |
| `npm run prisma:generate` | `prisma generate` | Generate Prisma client           |
| `npm run prisma:migrate`  | `prisma migrate dev` | Run database migrations         |
| `npm run prisma:studio`   | `prisma studio`     | Open Prisma Studio GUI          |
| `npm run prisma:seed`     | `tsx prisma/seed.ts` | Seed the database               |

### Frontend (`cd frontend`)

| Script             | Command              | Description                      |
| ------------------- | ------------------- | -------------------------------- |
| `npm run dev`       | `vite`              | Start Vite dev server             |
| `npm run build`     | `tsc && vite build` | Type-check and build for production |
| `npm run lint`      | `eslint .`          | Run ESLint                        |
| `npm run preview`   | `vite preview`      | Preview production build          |

---

## 🔧 Environment Variables

### Backend (`backend/.env`)

```env
DATABASE_URL=postgresql://erp_user:erp_password@localhost:5433/erp_inventory
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key
NODE_ENV=development
PORT=5000
CORS_ORIGIN=http://localhost:5173
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5000/api
```

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](./LICENSE) file for details.

---

## 👤 Author

**Vaibhav Waghalkar**

- 📧 Email: [vaibhavwaghalkar@gmail.com](mailto:vaibhavwaghalkar@gmail.com)
- 🌐 Portfolio: [https://dev-vaibhav-ai.co.in/](https://dev-vaibhav-ai.co.in/)
- 💼 LinkedIn: [Vaibhav Waghalkar](https://www.linkedin.com/in/vaibhav-waghalkar/)
- 🐙 GitHub: [@Vaibhav-Waghalkar](https://github.com/Vaibhav-Waghalkar)
