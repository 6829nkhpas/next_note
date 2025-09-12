# Multi-Tenant SaaS Notes App

A SaaS Notes application supporting multiple tenants (companies), with **role-based access** and **subscription gating**.

- **Tenants:** Acme and Globex  
- **Roles:** Admin (invite/upgrade), Member (CRUD notes)  
- **Plans:** Free (max 3 notes per tenant), Pro (unlimited)  
- **Auth:** JWT  
- **Backend + Frontend:** Deployed on Vercel  
- **Isolation:** Shared schema with `tenantId` column  

---

## Multi-Tenancy Approach

**Chosen approach:** Shared schema with a `tenantId` column.

- Simpler to implement than schema-per-tenant or DB-per-tenant.  
- Enforces strict tenant isolation in middleware (all queries scoped by `tenantId`).  
- Easier to scale and seed for two demo tenants (Acme, Globex).  

---

## Quick Start (Local)

1. Clone repo.
2. Copy `.env.example` → `.env`.
3. `npm install` in `/api` and `/web`.
4. Run DB (Postgres or MongoDB).
5. Run `npm run seed` to create tenants and test users.
6. Start backend: `npm run dev` (default port 8000).
7. Start frontend: `npm run dev` (default port 3000).
8. Login with predefined accounts to test.

---

## Folder Structure

```
/project-root
  /api                 # Backend (Node.js + Express)
    /src
      /controllers
      /routes
      /middleware
      /models
      /services
      /utils
    .env.example
    package.json
  /web                 # Frontend (Next.js / React)
    pages/
    components/
    services/          # API client
    .env.local.example
    package.json
  README.md
  vercel.json
```

---

## Environment Variables

`.env.example`

```env
PORT=8000
NODE_ENV=development
JWT_SECRET=supersecretkey
JWT_EXPIRES_IN=7d

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/notesapp
# OR Mongo
MONGODB_URI=mongodb://localhost:27017/notesapp

# CORS
CORS_ORIGIN=http://localhost:3000,https://your-frontend.vercel.app
```

---

## Database Schema

### Postgres Example

```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free',
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

---

## Authentication & Authorization

- **JWT-based login**  
- JWT payload includes: `sub` (userId), `tenantId`, `role`.  
- Middleware enforces tenant isolation and role checks.  

Example JWT payload:

```json
{
  "sub": "userId",
  "role": "admin",
  "tenantId": "tenantId",
  "iat": 123456,
  "exp": 1234567
}
```

---

## API Endpoints

### Auth
- `POST /auth/login` → returns JWT

### Notes
- `POST /notes` → Create (limit 3 if Free plan)  
- `GET /notes` → List tenant notes  
- `GET /notes/:id` → Get single note (tenant check)  
- `PUT /notes/:id` → Update note (tenant check)  
- `DELETE /notes/:id` → Delete note (tenant check)  

### Subscription
- `POST /tenants/:slug/upgrade` → Admin only, upgrades plan to Pro  

### Health
- `GET /health` → `{ "status": "ok" }`

---

## Subscription & Limits

- **Free plan:** max 3 notes per tenant.  
- **Pro plan:** unlimited.  
- On 4th note attempt in Free → return 403 with `{ error: "free_limit_reached" }`.  
- `POST /tenants/:slug/upgrade` → sets `plan = pro` immediately.  

---

## Seed Data

Seed script creates:

- Tenants: **Acme**, **Globex** (Free plan by default).  
- Users (password: `password`):  
  - `admin@acme.test` (Admin, Acme)  
  - `user@acme.test` (Member, Acme)  
  - `admin@globex.test` (Admin, Globex)  
  - `user@globex.test` (Member, Globex)  

---

## CORS & Health

- Enable CORS for frontend + Vercel domains.  
- `GET /health` → used by uptime checks.  

---

## Frontend Requirements

- Login form → store JWT.  
- Notes dashboard:
  - List notes
  - Create, delete, edit notes
  - Show tenant name and plan
- When Free plan hits 3 notes:
  - Show **Upgrade to Pro** (only visible to Admin).  
- On upgrade, remove note limit immediately.  

---

## Vercel Deployment

1. Deploy `/api` as Vercel Serverless API (Express / Next.js API routes).  
2. Deploy `/web` as frontend (Next.js).  
3. Set env vars in Vercel dashboard.  
4. Ensure CORS allows frontend domain.  
5. Verify with `/health` endpoint.  

Example `vercel.json`:

```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" }
  ]
}
```

---

## Testing (cURL)

Login:

```bash
curl -X POST https://<api-url>/auth/login   -H "Content-Type: application/json"   -d '{"email":"admin@acme.test","password":"password"}'
```

Create note:

```bash
curl -X POST https://<api-url>/notes   -H "Authorization: Bearer <TOKEN>"   -H "Content-Type: application/json"   -d '{"title":"My note","content":"hello"}'
```

Upgrade:

```bash
curl -X POST https://<api-url>/tenants/acme/upgrade   -H "Authorization: Bearer <ADMIN_TOKEN>"
```

Health:

```bash
curl https://<api-url>/health
```

---

## Security Notes

- Always hash passwords with bcrypt/argon2.  
- Never trust tenant slug → enforce `tenantId` from JWT.  
- Rate limit login endpoint.  
- Use HTTPS (Vercel provides TLS).  

---

## Implementation Checklist

- [ ] Setup repo + structure  
- [ ] Models (Tenant, User, Note)  
- [ ] Seed tenants + users  
- [ ] JWT login + middleware  
- [ ] Notes CRUD (tenant-scoped)  
- [ ] Subscription gating (3-note limit)  
- [ ] Upgrade endpoint (Admin only)  
- [ ] CORS + `/health` endpoint  
- [ ] Frontend login + dashboard + upgrade banner  
- [ ] Deploy API + frontend to Vercel  
- [ ] Verify test accounts and note limits  
