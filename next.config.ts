import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // small self-contained server for the Docker image
  // A new id for every build: a tab left open across a deploy reloads itself instead of failing
  // ("Failed to find Server Action"). See docs: next-config-js/deploymentId.
  deploymentId: process.env.NEXT_DEPLOYMENT_ID ?? `build-${Date.now().toString(36)}`,
  cacheComponents: true,
  devIndicators: false, // no "N" badge on the local dev server (screen recordings)
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
