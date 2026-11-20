import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // node:sqlite is a Node built-in; keep it external to the server bundle.
  serverExternalPackages: ["node:sqlite"],
  poweredByHeader: false,
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
