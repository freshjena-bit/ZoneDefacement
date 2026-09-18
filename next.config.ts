import type { NextConfig } from "next";

// Ensure DIRECT_URL defaults to DATABASE_URL if the operator only configured a
// single connection string. Prisma validates env("DIRECT_URL") at client-init,
// so without this the build/runtime fails with P1012 when DIRECT_URL is unset.
// This runs in the Next.js build + server process, so the env var persists for
// the Prisma Client loaded in serverless functions.
if (!process.env.DIRECT_URL && process.env.DATABASE_URL) {
  process.env.DIRECT_URL = process.env.DATABASE_URL;
}

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // The DefacerID archive is a single-route client app at `/`, but we expose
  // friendly URL paths (e.g. /leaderboard/attacker, /notify, /archive,
  // /report/:id) by rewriting them all back to `/`. The client reads
  // window.location.pathname to pick the right view, so these URLs work on
  // direct access / refresh too.
  async rewrites() {
    return [
      { source: "/leaderboard/:type(attacker|team)", destination: "/" },
      { source: "/notify", destination: "/" },
      { source: "/archive", destination: "/" },
      { source: "/onhold", destination: "/" },
      { source: "/special", destination: "/" },
      { source: "/report/:id", destination: "/" },
    ];
  },
};

export default nextConfig;
