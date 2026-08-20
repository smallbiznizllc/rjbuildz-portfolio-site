import type { NextConfig } from "next";

const useEmulators =
  process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true" ||
  process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  // Keep jsdom/DOMPurify out of the Turbopack server bundle — bundling them
  // breaks dynamic routes / API handlers on Vercel (static pages still work).
  serverExternalPackages: [
    "isomorphic-dompurify",
    "jsdom",
    "firebase-admin",
  ],
  async redirects() {
    return [
      {
        source: "/contact",
        destination: "/#contact",
        permanent: true,
      },
    ];
  },
  images: {
    // Next.js 16 blocks private IPs by default (SSRF protection).
    // Required so Firebase Storage emulator URLs (127.0.0.1:9199) can render.
    dangerouslyAllowLocalIP: useEmulators,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.firebasestorage.app",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "9199",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "9199",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
