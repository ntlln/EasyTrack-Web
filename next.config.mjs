import { getSecurityHeaders } from './lib/security-headers.js';

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: Object.entries(getSecurityHeaders()).map(([key, value]) => ({
          key,
          value,
        })),
      },
    ];
  },
  // Additional security configurations
  poweredByHeader: false, // Remove X-Powered-By header
  compress: true, // Enable compression
  experimental: {
    // Enable security features
    serverComponentsExternalPackages: [],
  },
};

export default nextConfig;
