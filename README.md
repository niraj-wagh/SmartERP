# SmartERP — Billing, Inventory & Accounting

Keyboard-first, Tally-inspired ERP. Clean **frontend + backend** separation.

## Architecture

```
smarterp-v2/
├── frontend/          Next.js 15 (React 19, Tailwind v4)
├── backend/           Express.js API (Node.js)
└── supabase/          Database schema + seed SQL
```

**Data flow:**
```
Browser → Next.js frontend
   └── (auth only) → Supabase Auth (login / signup / logout)
   └── (all data)  → Express backend (port 4000)
                         └── Supabase PostgreSQL (service-role key)
```

## Quick start

### 1. Supabase setup
1. Create a project at https://supabase.com
2. SQL Editor → paste **supabase/schema.sql** → Run
3. Project Settings → API → copy **Project URL** and two keys:
   - **anon public key** (for frontend)
   - **service_role key** (for backend — never expose publicly)

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env
# Fill SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CORS_ORIGIN
npm run dev        # → http://localhost:4000
```

### 3. Frontend
```bash
cd frontend
npm install
cp .env.local.example .env.local
# Fill NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_API_URL=http://localhost:4000
npm run dev        # → http://localhost:3000
```

### 4. Open http://localhost:3000 → Sign up → Create company → Dashboard

## App workflow

| Step | What happens |
|---|---|
| Visit `/` | Checks Supabase session → redirects to `/login` or `/companies` |
| Login / Signup | Supabase auth → JWT token stored in browser |
| `/companies` | Lists companies from backend API, create auto-redirects to dashboard |
| `/dashboard` | Guarded — needs `activeCompanyId` in localStorage |
| Any API call | Frontend attaches `Authorization: Bearer <jwt>` header |
| Backend | Verifies JWT via `supabase.auth.getUser(token)`, checks company membership |

## Keyboard shortcuts

| Key | Action |
|---|---|
| `Ctrl K` | Command palette |
| `F8` | New sales voucher |
| `F9` | New purchase entry |
| `Ctrl S` | Save current voucher |
| `Ctrl P` | Print |
| `Ctrl Shift P` | Download PDF |
| `F1` | Switch company |
| `Ctrl Q` | Log out |

## Deploy

**Backend** → Railway / Render / any Node.js host
```bash
cd backend && npm start
```
Set env vars: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CORS_ORIGIN=https://your-frontend.vercel.app`, `NODE_ENV=production`

**Frontend** → Vercel
```bash
cd frontend && vercel --prod
```
Set env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_URL=https://your-backend.railway.app`
