import { getSecurityHeaders } from './lib/security-headers.js';

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: Object.entries(getSecurityHeaders()).map(([key, value]) => ({
          key,
          value,
        })),
      },
    ];
  },
  poweredByHeader: false,
  compress: true,
  serverExternalPackages: [],
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
};

export default nextConfig;