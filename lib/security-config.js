export const securityConfig = {
  rateLimit: {
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  },
  cors: {
    origin: [
      'https://www.ghe-easytrack.org',
      'https://www.admin.ghe-easytrack.org',
      'https://www.airline.ghe-easytrack.org',
      'https://ghe-easytrack.org',
      'https://admin.ghe-easytrack.org',
      'https://airline.ghe-easytrack.org',
    ],
    credentials: true,
    optionsSuccessStatus: 200,
  },
  middleware: {
    trustProxy: true,
    noSniff: true,
    xssFilter: true,
    hidePoweredBy: true,
    crossOriginEmbedderPolicy: 'require-corp',
    crossOriginOpenerPolicy: 'same-origin',
    crossOriginResourcePolicy: 'same-origin',
  },
  csp: {
    production: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-eval'",
          "'unsafe-inline'",
          'https://maps.googleapis.com',
          'https://www.gstatic.com',
          'https://www.google.com',
          'https://accounts.google.com',
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://fonts.googleapis.com',
          'https://www.gstatic.com',
        ],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
        connectSrc: [
          "'self'",
          'data:',
          'blob:',
          'https://*.supabase.co',
          'https://*.supabase.com',
          'https://maps.googleapis.com',
          'https://www.google-analytics.com',
        ],
        frameSrc: ["'self'", 'data:', 'blob:', 'https://accounts.google.com'],
        mediaSrc: ["'self'", 'data:', 'blob:'],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
  },
};

export function getCSPDirectives() {
  return securityConfig.csp.production.directives;
}

export function generateCSPHeader() {
  const directives = getCSPDirectives();
  const cspDirectives = {
    'default-src': directives.defaultSrc,
    'script-src': directives.scriptSrc,
    'style-src': directives.styleSrc,
    'font-src': directives.fontSrc,
    'img-src': directives.imgSrc,
    'connect-src': directives.connectSrc,
    'frame-src': directives.frameSrc,
    'object-src': directives.objectSrc,
    'base-uri': directives.baseUri,
    'form-action': directives.formAction,
    'frame-ancestors': directives.frameAncestors,
    'upgrade-insecure-requests': directives.upgradeInsecureRequests
  };
  
  return Object.entries(cspDirectives)
    .filter(([key, values]) => values && values.length > 0)
    .map(([key, values]) => Array.isArray(values) ? `${key} ${values.join(' ')}` : key)
    .join('; ');
}

export const apiSecurityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

export function applyAPISecurityHeaders(response) {
  Object.entries(apiSecurityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}
