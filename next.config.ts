import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  experimental: {
    serverActions: {
      bodySizeLimit: 5 * 1024 * 1024, // 5MB
    },
  },
  serverRuntimeConfig: {
    port: 5054,
  },
};

export default nextConfig;
