import type { NextConfig } from "next";

import { withSerwist } from "@serwist/turbopack";

const nextConfig: NextConfig = {
  turbopack: {},
  serverExternalPackages: ["esbuild"],
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
};

export default withSerwist(nextConfig);
