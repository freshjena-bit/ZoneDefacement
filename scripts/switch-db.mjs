#!/usr/bin/env node
/**
 * Switch the active Prisma schema provider between SQLite (local dev) and
 * PostgreSQL (production / Supabase / Vercel).
 *
 * Usage:
 *   node scripts/switch-db.mjs sqlite     # use SQLite (local sandbox)
 *   node scripts/switch-db.mjs postgres   # use PostgreSQL (Supabase/Vercel)
 *
 * Copies the matching prisma/schema.<provider>.prisma file into
 * prisma/schema.prisma, then runs `prisma generate` so the Prisma Client
 * picks up the active provider.
 */
import { copyFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { execSync } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const schemasDir = join(root, "prisma");

const target = process.argv[2];
const valid = ["sqlite", "postgres"];
if (!valid.includes(target)) {
  console.error(`Usage: node scripts/switch-db.mjs <${valid.join("|")}>`);
  process.exit(1);
}

const src = join(schemasDir, `schema.${target}.prisma`);
const dest = join(schemasDir, "schema.prisma");

if (!existsSync(src)) {
  console.error(`Source schema not found: ${src}`);
  process.exit(1);
}

copyFileSync(src, dest);
console.log(`✓ Active schema set to ${target.toUpperCase()} (${src} → ${dest})`);

// Regenerate the Prisma Client so it uses the active provider.
try {
  execSync("bunx prisma generate", { cwd: root, stdio: "inherit" });
  console.log(`✓ Prisma Client regenerated for ${target}`);
} catch {
  console.warn(
    "⚠ prisma generate failed — run `bunx prisma generate` manually.",
  );
}

if (target === "postgres") {
  console.log(
    "\nNext steps for Supabase/Vercel:\n" +
      "  1. Set DATABASE_URL (Supabase pooler, port 6543) and DIRECT_URL (port 5432) in .env / Vercel.\n" +
      "  2. Run `bun run db:push` to create tables in Supabase.\n" +
      "  3. Deploy to Vercel — `postinstall` runs `prisma generate` automatically.",
  );
}
