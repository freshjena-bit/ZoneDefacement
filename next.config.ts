import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // The SAM1337 archive is a single-route client app at `/`, but we expose
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
