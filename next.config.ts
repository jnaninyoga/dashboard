import type { NextConfig } from "next";

import { withSerwist } from "@serwist/turbopack";

const nextConfig: NextConfig = {
  turbopack: {},
  serverExternalPackages: ["esbuild"],
};

export default withSerwist(nextConfig);
