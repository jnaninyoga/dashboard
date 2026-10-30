import type { NextConfig } from "next";

import { withSerwist } from "@serwist/turbopack";

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
