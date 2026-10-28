import type { NextConfig } from "next";

import { withSerwist } from "@serwist/turbopack";

const nextConfig: NextConfig = {
  env: {
    // Which deploy an error report came from (Vercel sets the commit SHA).
    NEXT_PUBLIC_APP_VERSION:
      process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "dev",
  },
  turbopack: {},
  serverExternalPackages: ["esbuild"],
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
};

export default withSerwist(nextConfig);
