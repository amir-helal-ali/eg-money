import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  // SECURITY: Do NOT ignore TypeScript build errors. The previous
  // `ignoreBuildErrors: true` setting shipped real bugs to production
  // (e.g., broken notification toggles in settings-panel.tsx). All type
  // errors must be fixed before deployment.
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: false,
};

export default nextConfig;
