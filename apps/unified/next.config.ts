import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@delaxpm/core'],
  experimental: {
    optimizePackageImports: ['@delaxpm/core'],
  },
  // Temporarily disabled for testing database redesign
  // output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  }
};

export default nextConfig;