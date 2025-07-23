import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@delaxpm/core'],
  experimental: {
    optimizePackageImports: ['@delaxpm/core'],
  },
};

export default nextConfig;