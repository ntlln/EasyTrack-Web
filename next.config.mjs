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
  // Domain configuration for production
  async rewrites() {
    return [
      // Handle www redirect to main domain
      {
        source: '/:path*',
        destination: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.ghe-easytrack.org',
          },
        ],
      },
      // Handle main domain routing
      {
        source: '/:path*',
        destination: '/:path*',
        has: [
          {
            type: 'host',
            value: 'ghe-easytrack.org',
          },
        ],
      },
      // Handle admin domain routing
      {
        source: '/admin/:path*',
        destination: '/admin/:path*',
        has: [
          {
            type: 'host',
            value: 'admin.ghe-easytrack.org',
          },
        ],
      },
      // Handle airline domain routing
      {
        source: '/airline/:path*',
        destination: '/airline/:path*',
        has: [
          {
            type: 'host',
            value: 'airline.ghe-easytrack.org',
          },
        ],
      },
    ];
  },
  // Environment-specific configuration
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
};

export default nextConfig;