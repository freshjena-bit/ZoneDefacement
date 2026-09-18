# Deploying DefacerID to Vercel + Supabase

This guide covers deploying the DefacerID mirror archive to **Vercel**
(hosting) with **Supabase** (PostgreSQL database).

---

## 1. Create a Supabase project

1. Go to <https://supabase.com> → **New project**.
2. Choose a name, set a strong database password, pick a region close to your
   users.
3. Wait for provisioning to finish (~2 min).

## 2. Get your connection strings

In your Supabase dashboard: **Project Settings → Database → Connection string**.

You need **two** URLs — both on `pooler.supabase.com` (IPv4, reachable from Vercel):

| Variable       | Pooler type | Port | Used for |
|----------------|-------------|------|----------|
| `DATABASE_URL` | Transaction pooler (PgBouncer) | 6543 | Runtime serverless queries |
| `DIRECT_URL`   | Session pooler | 5432 | Migrations (`prisma db push` during build) |

> ⚠️ **Why two URLs?** The session pooler (5432) has a max of 15 concurrent
> sessions — Vercel serverless exhausts them fast → `EMAXCONSESSION` error.
> The transaction pooler (6543) with PgBouncer multiplexes connections and
> handles many more, so it's used for runtime. Migrations need prepared
> statements (session mode), so they use `DIRECT_URL`.
>
> ⚠️ **Do NOT use the direct connection** (`db.xxx.supabase.co`) — it is
> IPv6-only on new Supabase projects and unreachable from Vercel's build
> environment (causes `P1001: Can't reach database server`).

The URLs look like:
```
DATABASE_URL=postgresql://postgres.xxxxx:PASSWORD@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://postgres.xxxxx:PASSWORD@aws-0-region.pooler.supabase.com:5432/postgres
```
Append `?pgbouncer=true&connection_limit=1` to the **transaction pooler** URL only.

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

> **Note**: the `build` script (`prisma generate && prisma db push --accept-data-loss && next build`)
> also runs `prisma db push` automatically on every Vercel deploy, so the table
> schema is always in sync. You only need to run `db:push` manually the first
> time (or skip it — the first Vercel build will create the tables for you).

## 5. Deploy to Vercel

1. Push the repo to GitHub/GitLab/Bitbucket.
2. Go to <https://vercel.com> → **Add New… → Project** → import your repo.
3. **Framework Preset**: Next.js (auto-detected).
4. **Build Command**: leave as default (`bun run build`) — it runs
   `prisma generate && prisma db push --accept-data-loss && next build`
   automatically (creates/updates the Supabase tables on every deploy).
5. **Environment Variables** — add these five:
   - `DATABASE_URL` — Supabase **transaction pooler** (port 6543)
     `postgresql://postgres.xxxxx:PASSWORD@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1`
   - `DIRECT_URL` — Supabase **session pooler** (port 5432)
     `postgresql://postgres.xxxxx:PASSWORD@aws-0-region.pooler.supabase.com:5432/postgres`
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

- **Two pooler URLs**: runtime queries use the **transaction pooler** (port 6543)
  with `?pgbouncer=true&connection_limit=1` — PgBouncer multiplexes connections so
  Vercel serverless doesn't hit the session pooler's 15-session limit
  (`EMAXCONSESSION`). Migrations use the **session pooler** (port 5432) via
  `DIRECT_URL` — session mode supports the prepared statements that `prisma db push`
  needs. Both are on `pooler.supabase.com` (IPv4). The direct connection
  (`db.xxx.supabase.co`) is IPv6-only and unreachable from Vercel.
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
