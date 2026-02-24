import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Отключить ESLint во время build (у нас свои правила)
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
