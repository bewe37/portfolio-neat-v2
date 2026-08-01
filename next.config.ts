import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    scrollRestoration: false,
  },
  images: {
    // Default quality (75) is a visible step down from source — keep near-lossless
    // since next/image is being adopted here purely for responsive sizing/lazy
    // loading, not as a compression pass.
    qualities: [90],
  },
};

export default nextConfig;
