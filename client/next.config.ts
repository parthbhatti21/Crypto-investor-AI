import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React strict mode for catching bugs early
  reactStrictMode: true,

  // Compress output
  compress: true,

  async headers() {
    return [
      {
        // ── Security headers (all routes) ───────────────────────────
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
          // ── ngrok interstitial bypass ───────────────────────────────
          // When the app is tunnelled via ngrok free tier, ngrok shows a
          // browser-warning interstitial that prevents Freighter from
          // communicating with the page (it sees a different origin).
          // Setting this response header tells the ngrok agent to skip the
          // warning page and serve the app directly, so wallet connection
          // works exactly as on localhost.
          // Docs: https://ngrok.com/docs/http/#ngrok-skip-browser-warning
          { key: "ngrok-skip-browser-warning", value: "true" },
        ],
      },
    ];
  },
};

export default nextConfig;
