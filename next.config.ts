import type { NextConfig } from "next";

import { withSerwist } from "@serwist/turbopack";

const nextConfig: NextConfig = {
  turbopack: {},
};

export default withSerwist(nextConfig);
