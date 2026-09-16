# Deploying ZoneDefacement to Vercel + Supabase

This guide covers deploying the ZoneDefacement mirror archive to **Vercel**
(hosting) with **Supabase** (PostgreSQL database).

---

## 1. Create a Supabase project

1. Go to <https://supabase.com> → **New project**.
2. Choose a name, set a strong database password, pick a region close to your
   users.
3. Wait for provisioning to finish (~2 min).

## 2. Get your connection strings

In your Supabase dashboard: **Project Settings → Database → Connection string**.

You need **two** URLs:

| Variable       | Connection type | Port | Used for              |
|----------------|-----------------|------|-----------------------|
| `DATABASE_URL` | Pooler (PgBouncer) | 6543 | Runtime queries (Vercel serverless) |
| `DIRECT_URL`   | Direct           | 5432 | Migrations / `prisma db push`       |

Both look like:
```
postgresql://postgres.xxxxx:your-password@aws-0-region.pooler.supabase.com:6543/postgres
```
Append `?pgbouncer=true&connection_limit=1` to the **pooler** URL only.

## 3. Switch the schema to PostgreSQL

The repo ships with SQLite as the default (for local sandbox dev). Switch to
PostgreSQL for production:

```bash
bun run db:use-postgres
```

This copies `prisma/schema.postgres.prisma` → `prisma/schema.prisma` and
regenerates the Prisma Client. (Switch back anytime with
`bun run db:use-sqlite`.)

## 4. Push the schema to Supabase

Create a `.env` file (or export the vars in your shell):

```bash
DATABASE_URL="postgresql://postgres.xxxxx:PASSWORD@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.xxxxx:PASSWORD@aws-0-region.pooler.supabase.com:5432/postgres"
AUTH_SECRET="a-long-random-secret-string"
```

Then create the tables:

```bash
bun run db:push
```

This runs `prisma db push` and creates the `Defacement` table in Supabase.
(The app auto-seeds ~260 demo records on first API call if the table is empty.)

## 5. Deploy to Vercel

1. Push the repo to GitHub/GitLab/Bitbucket.
2. Go to <https://vercel.com> → **Add New… → Project** → import your repo.
3. **Framework Preset**: Next.js (auto-detected).
4. **Build Command**: `next build` (default) — the `postinstall` script runs
   `prisma generate` automatically.
5. **Environment Variables** — add all five:
   - `DATABASE_URL` (pooler, port 6543, `?pgbouncer=true&connection_limit=1`)
   - `DIRECT_URL` (direct, port 5432)
   - `ADMIN_USERNAME` (your admin username — **override the demo default**)
   - `ADMIN_PASSWORD` (a strong password — **override the demo default**)
   - `AUTH_SECRET` (long random string for signing session tokens)
6. **Deploy**.

Vercel will `bun install` → `postinstall` (`prisma generate`) → `next build`
→ ship. The app is now live.

> **Security**: the admin credentials are read from env vars at request time,
> so they never appear in the source code. The demo defaults (`GadaLuBau` /
> `slametwkw`) are only used when the env vars are unset (i.e. local dev). In
> production on Vercel, always set `ADMIN_USERNAME` / `ADMIN_PASSWORD` to
> custom values.

## 6. Verify

- Visit your Vercel URL → the home page loads with the seeded archive.
- Log in as admin using the `ADMIN_USERNAME` / `ADMIN_PASSWORD` you set →
  Accept/Reject on-hold entries.
- Submit a defacement via `/notify` → it appears in the archive.

---

## Local development (SQLite)

For local dev without a database server, the repo defaults to SQLite:

```bash
bun run db:use-sqlite      # ensure SQLite schema is active
bun run db:push            # create the local SQLite tables
bun run dev                # start the dev server on :3000
```

The data lives in `db/custom.db`. No external services required.

---

## Notes

- **Why two URLs?** Supabase's PgBouncer pooler (port 6543) doesn't support
  Prisma's migration engine, so migrations use the direct URL (port 5432).
  Runtime queries use the pooler for efficient connection reuse in serverless.
- **Admin credentials** are configured via `ADMIN_USERNAME` / `ADMIN_PASSWORD`
  env vars (set them on Vercel). The HMAC session secret is `AUTH_SECRET`. In
  local dev, these fall back to demo defaults (`GadaLuBau` / `slametwkw`) so
  the sandbox works without configuration — always override in production.
- **Auto-verification**: submissions whose mirrored page contains
  "hacked by {attacker}" or "touched by {attacker}" are auto-verified; others
  enter the on-hold queue for admin review.
- **Switching schemas** (`db:use-sqlite` / `db:use-postgres`) only changes the
  Prisma provider — the models and all app code are identical for both
  databases.
