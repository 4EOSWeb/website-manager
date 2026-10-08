import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dev server allowlist includes localhost, but not 127.0.0.1. Without
  // this, the hot-reload socket is refused and React never hydrates.
  allowedDevOrigins: ["127.0.0.1"],
  serverExternalPackages: ["@prisma/client", "pg", "@prisma/adapter-pg"],
  turbopack: {
    root: import.meta.dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
