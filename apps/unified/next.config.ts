import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@delaxpm/core'],
  experimental: {
    optimizePackageImports: ['@delaxpm/core'],
  },
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  }
};

export default nextConfig;