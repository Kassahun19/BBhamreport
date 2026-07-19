# Bunna Bank Hamusit Branch — Daily Campaign Report System

A professional, fully functional, responsive, and animated campaign recording and tracking system designed for Bunna Bank Hamusit Branch to track digital banking product achievements.

## Features

- **Landing Page:** Interactive banking theme, animated totals counters, visual bento grid of tracked product campaigns, and action highlights.
- **Dynamic Live Dashboard:** View daily, weekly, monthly, yearly, and permanent grand totals for activations. Cards animate upon mount with count-up effects.
- **Daily campaign achievements log:** Standard CRUD form with automated calendar date analysis (populates Weekday, Month, and Week of Month dynamically from Date input). Supports validation preventing duplicate date entries or negative figures.
- **Advanced Journals Report:** Generates responsive reports by Date range, Month, Week, or Day with custom text searching, column sorting, pagination, and dynamic columns totals sum.
- **Visual Analytics:** Renders Bar, Doughnut, Stacked, and Area graphs using Recharts. Tracks product performances share, weekday averages, and month-over-month growth.
- **Secure Operator Portal:** Role-based access control (Admin/Staff) verified via JWT handshakes, password encryption, and full SQL transaction logs.
- **Audit Logging:** System automatically logs user logins, report creations, revisions, and deletions in real-time.
- **Data Export:** Integrated client-side export generating downloadable Excel-compatible CSV registers with sum total rows, and custom printing layouts.

---

## Technical Architecture

- **Frontend:** React.js 19 with Vite, Tailwind CSS v4, Lucide-React, and Recharts.
- **Backend:** Node.js, Express.js.
- **Database:** SQLite (SQL-compliant relational engine storing campaign_report.sqlite).
- **Authentication:** JSON Web Tokens (JWT) & bcryptjs hashing.

---

## Installation & Launch Guide

Follow these simple commands to boot the system locally or in container instances:

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Dev Environment
```bash
npm run dev
```
The server launches automatically at **http://localhost:3000** (Port 3000 is externally bound).

### 3. Compile for Production Deployments
The build bundles both the static client distribution and wraps the Node backend into a bundled CommonJS module:
```bash
npm run build
```
Launch the compiled distribution bundle via:
```bash
npm run start
```

---

## Testing Credentials

Use the following authorized operator credentials to evaluate all protected pages:

| Portal Role | Operator Username | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `admin123` | Log achievements, update, delete records, view audit logs |
| **Branch Staff** | `staff` | `staff123` | Log achievements, update records, view reports |

---

## Database Relational Model (SQL Schema)

The backend initiates the database file and initializes SQL schemas upon server launch. Below is the relational structure model:

### 1. Users Table
```sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  fullname TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin', 'staff')),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### 2. DailyReports Table
```sql
CREATE TABLE IF NOT EXISTS daily_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT UNIQUE NOT NULL, -- YYYY-MM-DD
  year INTEGER NOT NULL,
  month INTEGER NOT NULL, -- 1-12
  week INTEGER NOT NULL, -- 1-5
  day TEXT NOT NULL, -- Monday, Tuesday...
  customer_base INTEGER NOT NULL DEFAULT 0,
  mobile_banking INTEGER NOT NULL DEFAULT 0,
  internet_banking INTEGER NOT NULL DEFAULT 0,
  atm INTEGER NOT NULL DEFAULT 0,
  merchant INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE SET NULL
);
```

### 3. Audit Logs Table
```sql
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL,
  details TEXT,
  timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
);
```

---

## RESTful API Endpoints List

All API paths are routed securely and handled by the Express core:

### Authentication
- `POST /api/auth/login` - Handshake to exchange operator username & password for secure JWT tokens.
- `GET /api/auth/me` - Validates bearer JWT token of active workspace.

### Aggregations & Dashboard
- `GET /api/dashboard/summary` - Computes and returns relative totals dynamically on-the-fly (Today, Weekly, Monthly, Yearly, Overall).

### Journal Records (CRUD)
- `GET /api/reports` - Query daily entries with filters (`year`, `month`, `week`, `day`, `search`).
- `POST /api/reports` - Saves a new report (Authenticated operators).
- `PUT /api/reports/:id` - Re-evaluates and updates report indices (Authenticated operators).
- `DELETE /api/reports/:id` - Deletes a report (Administrators only).

### Statistics
- `GET /api/statistics` - Generates arrays structured for Recharts trends (Share percentages, chronological trends, weekday averages, monthly growth).

### Audit Logs
- `GET /api/logs` - Return active database operation history logs (Administrators only).

---

© 2026 Bunna Bank S.C. South Gondar District.
Developed for operational campaign excellence by **Kassahun Mulatu**.
