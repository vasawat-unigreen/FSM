import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Allow field photo uploads through server actions.
    serverActions: { bodySizeLimit: "8mb" },
  },
};

export default nextConfig;
