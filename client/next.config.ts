import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React strict mode for catching bugs early
  reactStrictMode: true,

  // Compress output
  compress: true,

  // Security headers for production
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },

  // Redirect bare domain to www on production (optional, handled by Vercel)
  // async redirects() { return []; },
};

export default nextConfig;
