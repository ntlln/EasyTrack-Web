/**
 * Security Middleware Utilities
 * Additional security middleware functions for Next.js
 */

import { NextResponse } from 'next/server';
import { applySecurityHeaders } from './security-headers.js';
import { applyAPISecurityHeaders } from './security-config.js';

/**
 * Security middleware wrapper for API routes
 * @param {Function} handler - API route handler
 * @returns {Function} - Wrapped handler with security headers
 */
export function withSecurityHeaders(handler) {
  return async (req, res) => {
    try {
      const response = await handler(req, res);
      
      // Apply security headers to the response
      return applySecurityHeaders(response);
    } catch (error) {
      const errorResponse = NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      );
      return applyAPISecurityHeaders(errorResponse);
    }
  };
}

/**
 * Security middleware for API routes with additional protections
 * @param {Function} handler - API route handler
 * @returns {Function} - Wrapped handler with enhanced security
 */
export function withEnhancedSecurity(handler) {
  return async (req, res) => {
    try {
      // Check for suspicious patterns
      const userAgent = req.headers.get('user-agent') || '';
      const suspiciousPatterns = [
        /sqlmap/i,
        /nikto/i,
        /nmap/i,
        /masscan/i,
        /zap/i,
        /burp/i,
        /w3af/i,
        /acunetix/i,
        /nessus/i,
        /openvas/i,
      ];
      
      if (suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }
      
      // Rate limiting check (basic implementation)
      const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
      const rateLimitKey = `rate_limit_${ip}`;
      
      // This is a basic implementation - in production, use Redis or similar
      if (global.rateLimitStore && global.rateLimitStore[rateLimitKey]) {
        const now = Date.now();
        const lastRequest = global.rateLimitStore[rateLimitKey];
        if (now - lastRequest < 1000) { // 1 second between requests
          return NextResponse.json(
            { error: 'Rate limit exceeded' },
            { status: 429 }
          );
        }
      }
      
      // Initialize rate limit store if not exists
      if (!global.rateLimitStore) {
        global.rateLimitStore = {};
      }
      global.rateLimitStore[rateLimitKey] = Date.now();
      
      const response = await handler(req, res);
      
      // Apply security headers
      return applySecurityHeaders(response);
    } catch (error) {
      const errorResponse = NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      );
      return applyAPISecurityHeaders(errorResponse);
    }
  };
}

/**
 * Security headers for static assets
 * @param {NextResponse} response - Response object
 * @returns {NextResponse} - Response with security headers
 */
export function applyStaticAssetSecurityHeaders(response) {
  const staticAssetHeaders = {
    'Cache-Control': 'public, max-age=31536000, immutable',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
  };
  
  Object.entries(staticAssetHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}

/**
 * Security headers for HTML responses
 * @param {NextResponse} response - Response object
 * @returns {NextResponse} - Response with security headers
 */
export function applyHTMLSecurityHeaders(response) {
  const htmlSecurityHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self), payment=()',
  };
  
  Object.entries(htmlSecurityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}

/**
 * Validate request origin
 * @param {Request} req - Request object
 * @returns {boolean} - Whether origin is valid
 */
export function validateOrigin(req) {
  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');
  
  const allowedOrigins = [
    'https://www.ghe-easytrack.org',
    'https://www.admin.ghe-easytrack.org',
    'https://www.airline.ghe-easytrack.org',
    'https://ghe-easytrack.org',
    'https://admin.ghe-easytrack.org',
    'https://airline.ghe-easytrack.org',
  ];
  
  // Allow requests without origin (direct navigation, Postman, etc.)
  if (!origin && !referer) {
    return true;
  }
  
  // Check if origin is in allowed list
  if (origin && allowedOrigins.includes(origin)) {
    return true;
  }
  
  // Check if referer is from allowed domain
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      const refererOrigin = refererUrl.origin;
      if (allowedOrigins.includes(refererOrigin)) {
        return true;
      }
    } catch (error) {
      // Invalid referer URL - continue with validation
    }
  }
  
  return false;
}
