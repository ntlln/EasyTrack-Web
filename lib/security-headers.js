/**
 * Security Headers Configuration
 * Implements comprehensive security headers for the Next.js application
 */

export const securityHeaders = {
  // Content Security Policy - Prevents XSS attacks
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://maps.googleapis.com https://maps.gstatic.com https://www.gstatic.com https://www.google.com https://accounts.google.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://www.gstatic.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob: https://maps.gstatic.com https://maps.googleapis.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.supabase.com https://maps.googleapis.com https://www.google-analytics.com https://www.gstatic.com https://fonts.gstatic.com",
    "worker-src 'self' blob:",
    "child-src 'self' blob:",
    "frame-src 'self' https://accounts.google.com https://www.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; '),

  // X-Frame-Options - Prevents clickjacking attacks
  'X-Frame-Options': 'DENY',

  // X-Content-Type-Options - Prevents MIME type sniffing
  'X-Content-Type-Options': 'nosniff',

  // Referrer-Policy - Controls referrer information
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Permissions-Policy - Controls browser features
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=(self)',
    'interest-cohort=()',
    'payment=()',
    'usb=()',
    'magnetometer=()',
    'gyroscope=()',
    'accelerometer=()',
    'ambient-light-sensor=()',
    'autoplay=()',
    'battery=()',
    'bluetooth=()',
    'cross-origin-isolated=()',
    'display-capture=()',
    'document-domain=()',
    'encrypted-media=()',
    'execution-while-not-rendered=()',
    'execution-while-out-of-viewport=()',
    'fullscreen=(self)',
    'gamepad=()',
    'keyboard-map=()',
    'midi=()',
    'oversized-images=()',
    'picture-in-picture=()',
    'publickey-credentials-get=()',
    'screen-wake-lock=()',
    'sync-xhr=()',
    'unoptimized-images=()',
    'unsized-media=()',
    'vertical-scroll=()',
    'web-share=()',
    'xr-spatial-tracking=()'
  ].join(', '),

  // Additional security headers
  'X-DNS-Prefetch-Control': 'off',
  'X-Download-Options': 'noopen',
  'X-Permitted-Cross-Domain-Policies': 'none',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin'
};

/**
 * Apply security headers to a Next.js response
 * @param {NextResponse} response - The Next.js response object
 * @returns {NextResponse} - Response with security headers applied
 */
export function applySecurityHeaders(response) {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

/**
 * Get security headers as an object
 * @returns {Object} - Security headers object
 */
export function getSecurityHeaders() {
  return { ...securityHeaders };
}

