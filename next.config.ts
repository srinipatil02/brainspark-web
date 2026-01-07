import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export', // Static export for Firebase Hosting
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
