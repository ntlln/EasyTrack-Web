import { NextResponse } from 'next/server';
import { applySecurityHeaders } from './security-headers.js';
import { applyAPISecurityHeaders } from './security-config.js';
export function withSecurityHeaders(handler) {
  return async (req, res) => {
    try {
      return applySecurityHeaders(await handler(req, res));
    } catch (error) {
      return applyAPISecurityHeaders(NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      ));
    }
  };
}

export function withEnhancedSecurity(handler) {
  return async (req, res) => {
    try {
      const userAgent = req.headers.get('user-agent') || '';
      const suspiciousPatterns = [/sqlmap/i, /nikto/i, /nmap/i, /masscan/i, /zap/i, /burp/i, /w3af/i, /acunetix/i, /nessus/i, /openvas/i];
      
      if (suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
      
      const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
      const rateLimitKey = `rate_limit_${ip}`;
      
      if (global.rateLimitStore?.[rateLimitKey] && Date.now() - global.rateLimitStore[rateLimitKey] < 1000) {
        return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
      }
      
      global.rateLimitStore = global.rateLimitStore || {};
      global.rateLimitStore[rateLimitKey] = Date.now();
      
      return applySecurityHeaders(await handler(req, res));
    } catch (error) {
      return applyAPISecurityHeaders(NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      ));
    }
  };
}

export function applyStaticAssetSecurityHeaders(response) {
  const headers = {
    'Cache-Control': 'public, max-age=31536000, immutable',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY'
  };
  
  Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
  return response;
}

export function applyHTMLSecurityHeaders(response) {
  const headers = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self), payment=()'
  };
  
  Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
  return response;
}

export function validateOrigin(req) {
  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');
  
  const allowedOrigins = [
    'https://www.ghe-easytrack.org',
    'https://www.admin.ghe-easytrack.org',
    'https://www.airline.ghe-easytrack.org',
    'https://ghe-easytrack.org',
    'https://admin.ghe-easytrack.org',
    'https://airline.ghe-easytrack.org'
  ];
  
  if (!origin && !referer) return true;
  if (origin && allowedOrigins.includes(origin)) return true;
  
  if (referer) {
    try {
      return allowedOrigins.includes(new URL(referer).origin);
    } catch {
      return false;
    }
  }
  
  return false;
}
