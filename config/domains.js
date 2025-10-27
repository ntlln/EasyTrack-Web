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
  return hostname === config.mainDomain;
};

export const isWwwDomain = (hostname) => {
  const config = getDomainConfig();
  return hostname === config.wwwDomain;
};

export const getRedirectUrl = (hostname, pathname) => {
  const config = getDomainConfig();

  if (isWwwDomain(hostname)) {
    return `https://${config.mainDomain}${pathname}`;
  }

  if (isMainDomain(hostname)) {
    if (pathname.startsWith('/admin')) {
      return `${config.adminUrl}${pathname}`;
    }
    if (pathname.startsWith('/airline')) {
      return `${config.airlineUrl}${pathname}`;
    }
    // Don't redirect the main domain root path - let it serve normally
    return null;
  }

  if (isAdminDomain(hostname)) {
    if (pathname.startsWith('/admin')) {
      return `${config.adminUrl}${pathname.replace('/admin', '') || '/'}`;
    }
    if (pathname === '/') {
      return `${config.adminUrl}/`;
    }
  }

  if (isAirlineDomain(hostname)) {
    if (pathname.startsWith('/airline')) {
      return `${config.airlineUrl}${pathname.replace('/airline', '') || '/'}`;
    }
    if (pathname === '/') {
      return `${config.airlineUrl}/`;
    }
  }

  return null;
};
