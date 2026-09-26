# Prodesk — Sprint 16

> **Fullstack Personal Operations Dashboard**  
> Next.js 16 (React 19) + Express 5 + MongoDB / Mongoose + Google Gemini AI Pipeline

---

## Overview

Prodesk is an enterprise-grade personal operations and task management dashboard developed across Sprints 14, 15, and 16. It combines secure JWT authentication, responsive CRUD task management, interactive data visualization, server-side AI analysis, and production-hardened infrastructure.

### Sprint 16 Highlights

- **Track A (Frontend UX & Client AI)**:
  - Client-side AI operational analysis card with executive summaries and workload health metrics.
  - Interactive Recharts charts (Status distribution, Priority breakdown, and Timeline analytics).
  - Modern responsive UX/UI with dark glassmorphism, smooth micro-transitions, and mobile drawer support.
  - Custom Toast Notification system with auto-dismiss and action hooks.
  - Granular Error Boundaries and graceful loading skeleton states.
- **Track B (Backend Server Hardening & AI Pipelines)**:
  - **Server-Side AI Pipeline**: Google Gemini (`gemini-2.0-flash`) integrated via server-side Express with 8-second request timeouts (`AbortSignal.timeout`) and zero client-side credential exposure.
  - **AI-Driven Data Enrichment**: Automatic item categorization, keyword tagging, and 1-sentence synopsis generation on creation.
  - **Zero-Downtime Heuristic Fallback**: Built-in rule-based analytical engine guaranteeing continuous operation if upstream AI APIs are unavailable.
  - **Security Hardening**: `helmet` HTTP protection headers and request payload caps (15kb).
  - **Differentiated Rate Limiting**: `express-rate-limit` with isolated tiers for Auth (20 req/15min), AI (30 req/15min), and CRUD (300 req/15min); `/health` probe exempt.
  - **Structured Production Logging**: Winston logger with recursive secret redaction (`password`, `token`, `key`, `secret`) and Morgan HTTP access stream.
  - **Dual-Storage Resilience**: Mongoose connection pool backed by an in-memory fallback store ensuring non-blocking startup and offline resilience.

---

## Requirements

- **Node.js**: v20.9 or newer (Node v22 recommended)
- **Database**: MongoDB Atlas cluster or local MongoDB instance (optional: auto-falls back to resilient local store if Atlas is unreachable)
- **Operating System**: Windows / macOS / Linux

---

## Project Structure

```
Sprint16/
├── README.md               # Root documentation
├── package.json            # Root command proxies
└── Sprint15/               # Application codebase
    ├── app/                # Next.js 16 App Router (frontend pages & layouts)
    ├── components/         # React components (charts, forms, toast, AI cards)
    ├── lib/                # API client, auth session utilities, AI wrappers
    ├── public/             # Static assets
    ├── .env                # Frontend environment configuration
    ├── .env.example        # Frontend environment template
    ├── package.json        # Frontend scripts and dependencies
    └── backend/            # Express 5 API server
        ├── src/
        │   ├── app.js      # Express app setup, Helmet, CORS, Morgan, rate limiters
        │   ├── server.js   # Server entrypoint (Port 4000)
        │   ├── config/     # Database singleton connection (Mongoose)
        │   ├── controllers/# Auth, workspace items, and AI controllers
        │   ├── middleware/ # JWT authentication, rate limiting
        │   ├── models/     # User and WorkspaceItem Mongoose schemas
        │   ├── routes/     # Express REST routers
        │   ├── services/   # Gemini AI service and heuristic fallbacks
        │   └── utils/      # Winston production logger, fallback store
        ├── scripts/        # Concurrency and load testing scripts
        ├── .env            # Backend environment configuration
        ├── .env.example    # Backend environment template
        └── package.json    # Backend scripts and dependencies
```

---

## Quick Start

### 1. Install Dependencies

You can run `install:all` from the workspace root or install directly within `Sprint15`:

```powershell
# From N:\Sprint\Sprint16
npm run install:all

# OR from N:\Sprint\Sprint16\Sprint15
npm install
npm --prefix backend install
```

---

### 2. Configure Environment Variables

The repository includes pre-configured environment files. Review or adjust them if needed:

#### Frontend (`Sprint15/.env` or `Sprint15/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

#### Backend (`Sprint15/backend/.env`):
```env
PORT=4000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters
JWT_EXPIRES_IN=7d
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.example.mongodb.net/prodesk?retryWrites=true&w=majority

# Optional: Server-side Gemini AI Key (system uses heuristic engine if omitted)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash
AI_REQUEST_TIMEOUT_MS=8000

# Rate limits (requests per 15 minutes)
AUTH_RATE_LIMIT_MAX=20
AI_RATE_LIMIT_MAX=30
GENERAL_RATE_LIMIT_MAX=300
```

---

### 3. Run the Application

Open **two terminal windows**:

#### Terminal 1 — Backend API (Port 4000)
```powershell
cd N:\Sprint\Sprint16\Sprint15
npm run dev:server
```
*Health probe: [http://localhost:4000/health](http://localhost:4000/health)*

#### Terminal 2 — Frontend (Port 3000)
```powershell
cd N:\Sprint\Sprint16\Sprint15
npm run dev
```
*App URL: [http://localhost:3000](http://localhost:3000)*

> [!NOTE]
> **If Port 3000 is already in use:**
> Next.js will automatically select the next available port (e.g., `http://localhost:3001`). If you wish to free port 3000 on Windows, run:
> ```powershell
> netstat -ano | findstr :3000
> taskkill /PID <PID> /F
> ```

---

## Production Build & Run

To test optimized production bundles locally:

```powershell
# Terminal 1 — Backend Production Mode
cd N:\Sprint\Sprint16\Sprint15\backend
npm start

# Terminal 2 — Frontend Production Build & Serve
cd N:\Sprint\Sprint16\Sprint15
npm run build
npm start
```

---

## REST API Reference

All protected endpoints require an `Authorization: Bearer <token>` header.

| Method | Endpoint | Protection | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Public | Server uptime and health probe (exempt from rate limits) |
| `POST` | `/api/auth/register` | Rate limited (20/15m) | Register a new user with bcrypt password hashing |
| `POST` | `/api/auth/login` | Rate limited (20/15m) | Authenticate user credentials and issue signed JWT |
| `GET` | `/api/auth/me` | JWT Protected | Retrieve current user profile |
| `GET` | `/api/workspace-items` | JWT Protected | List all workspace items owned by the authenticated user |
| `POST` | `/api/workspace-items` | JWT Protected | Create a workspace item with automatic AI data enrichment |
| `PUT` | `/api/workspace-items/:id`| JWT Protected | Update an existing workspace item (ownership validated) |
| `DELETE` | `/api/workspace-items/:id`| JWT Protected | Delete a workspace item (ownership validated) |
| `POST` | `/api/ai/summary` | JWT + AI Limited (30/15m)| Generate executive AI summary and workload analytics |
| `POST` | `/api/ai/analyze` | JWT + AI Limited (30/15m)| Run AI contextual analysis on workspace items |

---

## Quality & Concurrency Verification

### Lint & TypeScript Verification
```powershell
cd N:\Sprint\Sprint16\Sprint15
npm run lint
```
*Result: 0 errors, 0 warnings.*

### Production Build
```powershell
cd N:\Sprint\Sprint16\Sprint15
npm run build
```
*Result: Next.js Turbopack compilation successful; all routes generated.*

### Concurrency & Memory Load Test
```powershell
node N:\Sprint\Sprint16\Sprint15\backend\scripts\concurrency-test.js
```
*Result: 66 concurrent requests across health, CRUD, enrichment, and AI endpoints with 100% success rate and +6.25MB heap delta.*
