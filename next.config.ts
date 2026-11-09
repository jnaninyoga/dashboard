import type { NextConfig } from "next";

import { withSerwist } from "@serwist/turbopack";

// Without these a build still passes, then nobody can sign in. Failing here
// keeps the last good deploy live instead.
if (process.env.NODE_ENV === "production") {
  for (const name of ["BETTER_AUTH_SECRET", "AUTH_ALLOWED_EMAILS"]) {
    if (!process.env[name]) throw new Error(`${name} is required for a production build`);
  }
}

const nextConfig: NextConfig = {
  env: {
    // Which deploy an error report came from (Vercel sets the commit SHA).
    NEXT_PUBLIC_APP_VERSION:
      process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "dev",
  },
  turbopack: {},
  // The price list moved out of Settings (and found its names): old links still land.
  async redirects() {
    return [
      { source: "/settings/memberships", destination: "/price-list/memberships", permanent: true },
      { source: "/settings/categories", destination: "/price-list/discounts", permanent: true },
      { source: "/settings/b2b", destination: "/price-list/partner-rates", permanent: true },
    ];
  },
  serverExternalPackages: ["esbuild"],
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
};

export default withSerwist(nextConfig);
