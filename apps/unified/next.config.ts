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
  },
  // Netlify用の最適化設定
  compress: true,
  poweredByHeader: false,
  // CSS最適化 - TailwindCSSが確実に含まれるように設定
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // 静的アセットの最適化
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
};

export default nextConfig;