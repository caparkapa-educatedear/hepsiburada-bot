import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true, // Often needed on shared hosting if optimization libs are missing
  }
};

export default nextConfig;
