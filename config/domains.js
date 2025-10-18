// Domain configuration for different environments
const domainConfig = {
  development: {
    baseUrl: 'http://localhost:3000',
    adminUrl: 'http://admin.localhost:3000',
    airlineUrl: 'http://airline.localhost:3000',
    adminDomain: 'admin.localhost:3000',
    airlineDomain: 'airline.localhost:3000',
    mainDomain: 'localhost:3000'
  },
  production: {
    baseUrl: 'https://ghe-easytrack.org',
    adminUrl: 'https://admin.ghe-easytrack.org',
    airlineUrl: 'https://airline.ghe-easytrack.org',
    adminDomain: 'admin.ghe-easytrack.org',
    airlineDomain: 'airline.ghe-easytrack.org',
    mainDomain: 'ghe-easytrack.org',
    wwwDomain: 'www.ghe-easytrack.org'
  }
};

export const getDomainConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  return domainConfig[env] || domainConfig.development;
};

export const isAdminDomain = (hostname) => {
  const config = getDomainConfig();
  return hostname === config.adminDomain || hostname.includes('admin.localhost') || hostname.includes('admin.ghe-easytrack.org');
};

export const isAirlineDomain = (hostname) => {
  const config = getDomainConfig();
  return hostname === config.airlineDomain || hostname.includes('airline.localhost') || hostname.includes('airline.ghe-easytrack.org');
};

export const isMainDomain = (hostname) => {
  const config = getDomainConfig();
  return hostname === config.mainDomain || hostname === config.wwwDomain;
};

export const isWwwDomain = (hostname) => {
  const config = getDomainConfig();
  return hostname === config.wwwDomain;
};

export const getRedirectUrl = (hostname, pathname) => {
  const config = getDomainConfig();
  
  // Handle www redirect to main domain
  if (isWwwDomain(hostname)) {
    return `https://${config.mainDomain}${pathname}`;
  }
  
  // Handle main domain with admin/airline paths
  if (isMainDomain(hostname)) {
    if (pathname.startsWith('/admin')) {
      return `${config.adminUrl}${pathname}`;
    }
    if (pathname.startsWith('/airline')) {
      return `${config.airlineUrl}${pathname}`;
    }
    // For root path on main domain, redirect to admin (or create a landing page)
    if (pathname === '/') {
      return config.adminUrl;
    }
  }
  
  if (isAdminDomain(hostname)) {
    // For admin domain, redirect to clean URL without /admin prefix
    if (pathname.startsWith('/admin')) {
      return `${config.adminUrl}${pathname.replace('/admin', '') || '/'}`;
    }
    // For root path on admin domain, redirect to admin dashboard
    if (pathname === '/') {
      return `${config.adminUrl}/`;
    }
  }
  
  if (isAirlineDomain(hostname)) {
    // For airline domain, redirect to clean URL without /airline prefix
    if (pathname.startsWith('/airline')) {
      return `${config.airlineUrl}${pathname.replace('/airline', '') || '/'}`;
    }
    // For root path on airline domain, redirect to airline dashboard
    if (pathname === '/') {
      return `${config.airlineUrl}/`;
    }
  }
  
  return null;
};
