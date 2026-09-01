# Preschool Fee Tracker (Supabase PostgreSQL)

A modern, full-stack preschool and early education fee management system. Built with **React 18 + Vite + TypeScript** and powered by **Supabase PostgreSQL** via a secure **Node.js Express** backend API.

---

## ✨ Features

- **Robust Relational Architecture:** Powered by Supabase PostgreSQL with strict foreign keys, UUID primary keys, and index-level monthly fee duplicate protection.
- **Enhanced Payment Workflow:** Complete payment recording with auto-detection of fee categories:
  - **Monthly Fees:** Academic session and required month selector with duplicate payment prevention.
  - **Annual Fees:** One-time annual fee tracking without redundant month values.
  - **Uniforms:** Winter, Summer, Sports uniform types with size selection (`20`, `22`, `24`, `26`).
  - **Books / Stationery & Miscellaneous:** Custom descriptions for extracurricular kits, picnics, and activities.
- **Real-Time Student Search & Auto-fill:** Fast search across student name, admission number, parent name, and contact number with read-only confirmation cards.
- **Clean Receipt & PDF Generation:** Clean, professional payment receipts with zero placeholder artifacts (`-`, `N/A`), printable and downloadable via PDF (`jsPDF` + `html2canvas`).
- **Dashboard & Analytics:** Real-time revenue metrics, today's collection, academic session breakdowns, monthly trend charts, and category distributions.
- **Student Ledger & History:** View itemized payment histories per student with printable ledger exports.
- **Role-Based Security:** JWT authentication with hashed credentials (`bcrypt`), HTTP-only cookies, security headers (`helmet`), rate limiting (`express-rate-limit`), and privileged server-side Supabase client (`@supabase/supabase-js`). The Supabase service-role key is never exposed to the client.

---

## 🛠️ Technology Stack

### Frontend
- **Framework:** [React 18](https://react.dev/) + [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **UI Components:** [shadcn/ui](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/) + [Lucide Icons](https://lucide.dev/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **State Management & Data Fetching:** [TanStack React Query](https://tanstack.com/query/latest) + [Axios](https://axios-http.com/)
- **Charts & Export:** [Recharts](https://recharts.org/), [jsPDF](https://github.com/parallax/jsPDF), [html2canvas](https://html2canvas.hertzen.com/)

### Backend
- **Runtime:** [Node.js](https://nodejs.org/) (ES Modules)
- **Framework:** [Express 5](https://expressjs.com/)
- **Database:** [Supabase PostgreSQL](https://supabase.com/)
- **Database Client:** [`@supabase/supabase-js`](https://github.com/supabase/supabase-js)
- **Authentication & Security:** JWT (JSON Web Tokens), `bcrypt`, `helmet`, `cors`, `cookie-parser`, `express-rate-limit`

---

## 📁 Project Structure

```text
preschool-fee-tracker/
├── backend/
│   ├── config/           # Supabase client initialization
│   ├── controllers/      # Express route controllers (Auth, Student, Fee, Dashboard, Reports)
│   ├── db/migrations/    # PostgreSQL schema SQL files for Supabase
│   ├── middleware/       # JWT auth & error middleware
│   ├── routes/           # REST API routes
│   ├── scripts/          # MongoDB -> Supabase data migration script
│   ├── services/         # Supabase data-access & business logic layer
│   ├── utils/            # Token generators and helpers
│   ├── seed.js           # Supabase database seeder (admin & default settings)
│   ├── server.js         # Express backend server entry point
│   └── .env.example      # Environment variables template
├── frontend/
│   ├── src/
│   │   ├── components/   # UI components (RecordPaymentDialog, FeeReceipt, StudentList, Charts, etc.)
│   │   ├── hooks/        # Custom React hooks (useToast, etc.)
│   │   ├── pages/        # Views (Dashboard, Auth, Admins, ResetPassword, etc.)
│   │   ├── types/        # TypeScript interfaces & Enums
│   │   ├── lib/          # Axios API instance
│   │   ├── App.tsx       # Main router & providers
│   │   └── main.tsx      # React entry point
│   └── vite.config.ts    # Vite bundler configuration
└── package.json          # Root orchestration scripts
```

---

## 🚀 Setup & Installation

### 1. Prerequisites
- **Node.js**: `v18.x` or higher
- **npm**: `v9.x` or higher
- **Supabase Account**: A free project on [Supabase.com](https://supabase.com)

---

### 2. Install Dependencies

From the project root:
```bash
npm run install:all
```

---

### 3. Supabase Database Setup

1. Log into your **Supabase Dashboard** and create a new project.
2. Go to the **SQL Editor** tab in Supabase.
3. Open [`backend/db/migrations/001_initial_schema.sql`](file:///e:/preschool-fee-tracker-main/backend/db/migrations/001_initial_schema.sql).
4. Copy and paste the SQL content into the SQL Editor and click **Run**.
   *(This creates `users`, `students`, `fee_payments`, `settings` tables, unique constraints, and indexes.)*

---

### 4. Backend Environment Configuration

Create a `.env` file in the `backend/` directory based on [`backend/.env.example`](file:///e:/preschool-fee-tracker-main/backend/.env.example):

```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173

# Supabase Credentials (Project Settings -> API)
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT Secret
JWT_SECRET=supersecretjwtkey123_change_in_production

# Initial Admin Credentials for Seeding
ADMIN_NAME=Super Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
```

> [!CAUTION]
> **Security Rule:** `SUPABASE_SERVICE_ROLE_KEY` must **ONLY** be set on the backend. Never expose it to frontend environment variables or client-side code.

---

### 5. Seed Database

Run the database seed script to populate the initial admin account and default preschool settings in Supabase:

```bash
npm run seed
```

---

### 6. (Optional) Migrate Existing MongoDB Data

If you have historical data in MongoDB that you wish to transfer to Supabase:
1. Ensure your MongoDB instance is accessible and set `MONGO_URI` in `backend/.env`.
2. Run the migration script:
```bash
node backend/scripts/migrate-mongodb-to-supabase.js
```
The script will import users, students, and payment records while preserving receipt numbers, timestamps, and computing a verification checksum.

---

### 7. Run the Application

Start both backend and frontend development servers concurrently:

```bash
npm run dev
```

Or run them individually:
- **Backend** (`http://localhost:5000`):
  ```bash
  cd backend
  npm run dev
  ```
- **Frontend** (`http://localhost:5173`):
  ```bash
  cd frontend
  npm run dev
  ```

---

## 🔑 Default Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@example.com` | `admin123` |

---

## 📡 Key API Endpoints

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate user & issue JWT | Public |
| `GET` | `/api/auth/me` | Current authenticated user profile | Authenticated |
| `POST` | `/api/auth/logout` | Clear session cookie | Authenticated |
| `GET` | `/api/dashboard/statistics`| Dashboard metrics & fee summaries | Authenticated |
| `GET` | `/api/dashboard/charts` | Monthly & category chart breakdowns | Authenticated |
| `GET` | `/api/students` | Get/search student directory | Authenticated |
| `POST` | `/api/students` | Register new student | Admin |
| `GET` | `/api/students/:id` | Get student profile & fee history | Authenticated |
| `PUT` | `/api/students/:id` | Update student details | Admin |
| `DELETE`| `/api/students/:id` | Delete student & fee records | Admin |
| `GET` | `/api/fees` | Filter & retrieve payment records | Authenticated |
| `POST` | `/api/fees` | Record fee payment & generate receipt | Admin |
| `GET` | `/api/fees/student/:studentId` | Get fee history for specific student | Authenticated |
| `GET` | `/api/reports/monthly` | Generate monthly collection reports | Authenticated |
| `GET` | `/api/reports/outstanding`| Generate outstanding dues reports | Authenticated |

---

## ☁️ Vercel Production Deployment

The project is pre-configured for a **Single-Project Vercel Deployment** (`React Frontend` + `Express /api Serverless Functions`).

### 1. Vercel Project Settings
* **Framework Preset:** `Vite` (or `Other`)
* **Root Directory:** `./` (Project Root)
* **Build Command:** `npm run build` (or `npm run build --prefix frontend`)
* **Output Directory:** `frontend/dist`
* **Install Command:** `npm run install:all`

### 2. Environment Variables Required in Vercel Dashboard
Navigate to **Project Settings -> Environment Variables** in Vercel and add:

| Variable Name | Scope | Required | Description |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Backend / Serverless | **Yes** | Set to `production` |
| `SUPABASE_URL` | Backend / Serverless | **Yes** | Your Supabase Project URL (`https://xyz.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend / Serverless | **Yes** | Supabase Service Role Key (*Keep secret!*) |
| `JWT_SECRET` | Backend / Serverless | **Yes** | Long, secure random string for signing JWT tokens |
| `CLIENT_URL` | Backend / Serverless | Optional | Production URL (`https://your-app.vercel.app`) |
| `VITE_SUPABASE_URL` | Frontend | Optional | Supabase Project URL (if direct client queries are enabled) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Frontend | Optional | Supabase Anon/Public Key |

---

## 📜 License

This project is licensed under the [ISC License](file:///e:/preschool-fee-tracker-main/backend/package.json).
