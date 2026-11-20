import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";

/**
 * The dev server and production builds use separate folders, so `npm run build` / `npm start`
 * work while `npm run dev` is still running (sharing `.next` corrupts both).
 * @type {(phase: string) => import('next').NextConfig}
 */
const nextConfig = (phase) => ({
  reactStrictMode: true,
  // Vercel expects the standard ".next" folder.
  distDir: process.env.NEXT_DIST_DIR || (process.env.VERCEL || phase === PHASE_DEVELOPMENT_SERVER ? ".next" : ".next-prod"),
  poweredByHeader: false,
  images: { remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }] },
  // Tree-shake big barrels so each route compiles only what it uses.
  experimental: { optimizePackageImports: ["@react-three/drei", "three-stdlib", "framer-motion", "recharts"] },
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=()" },
        ],
      },
    ];
  },
});
export default nextConfig;
