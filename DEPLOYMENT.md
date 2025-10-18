# Domain Configuration for Production

This document outlines the domain configuration for the EasyTrack application in production.

## Domain Structure

### Production Domains
- **Main Application**: `https://ghe-easytrack.org` (redirects to admin portal)
- **WWW Domain**: `https://www.ghe-easytrack.org` (redirects to main domain)
- **Admin Portal**: `https://admin.ghe-easytrack.org` (redirects to `/admin`)
- **Airline Portal**: `https://airline.ghe-easytrack.org` (redirects to `/airline`)

### Development Domains
- **Local Development**: `http://localhost:3000`
- **Admin Routes**: `http://localhost:3000/admin`
- **Airline Routes**: `http://localhost:3000/airline`

## Configuration Files

### 1. Domain Configuration (`config/domains.js`)
Contains environment-specific domain mappings and utility functions for domain detection.

### 2. Middleware (`middleware.js`)
Handles domain-based routing and redirects users to the appropriate portal based on the domain they access.

### 3. Next.js Configuration (`next.config.mjs`)
Includes rewrite rules for domain-specific routing in production.

## How It Works

1. **Domain Detection**: The middleware detects which domain the user is accessing
2. **Automatic Redirects**: Users are automatically redirected to the correct portal:
   - `www.ghe-easytrack.org` → `ghe-easytrack.org` (www redirect)
   - `ghe-easytrack.org` → `/admin` (main domain redirects to admin)
   - `ghe-easytrack.org/admin` → `admin.ghe-easytrack.org/admin` (admin path redirect)
   - `ghe-easytrack.org/airline` → `airline.ghe-easytrack.org/airline` (airline path redirect)
   - `admin.ghe-easytrack.org` → `/admin` routes
   - `airline.ghe-easytrack.org` → `/airline` routes
3. **Layout Protection**: Each layout (admin/airline) includes domain-aware redirect logic
4. **Session Management**: Authentication and session management work seamlessly across domains

## Deployment Requirements

### DNS Configuration
Ensure the following DNS records are configured:
```
ghe-easytrack.org         → Your server IP
www.ghe-easytrack.org     → Your server IP
admin.ghe-easytrack.org   → Your server IP
airline.ghe-easytrack.org → Your server IP
```

### Environment Variables
Set the following environment variables in production:
```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://ghe-easytrack.org
NEXT_PUBLIC_ADMIN_URL=https://admin.ghe-easytrack.org
NEXT_PUBLIC_AIRLINE_URL=https://airline.ghe-easytrack.org
```

### Server Configuration
The server should be configured to:
1. Handle multiple domains on the same application
2. Support HTTPS for all domains
3. Properly route requests based on the Host header

## Testing

### Local Testing
1. Add entries to your `/etc/hosts` file:
   ```
   127.0.0.1 admin.localhost
   127.0.0.1 airline.localhost
   ```

2. Access the application via:
   - `http://admin.localhost:3000` (should redirect to admin portal)
   - `http://airline.localhost:3000` (should redirect to airline portal)

### Production Testing
1. Verify domain redirects work correctly
2. Test authentication flows on each domain
3. Ensure session management works across domain switches
4. Test all navigation and routing within each portal

## Security Considerations

1. **CORS Configuration**: Ensure proper CORS settings for cross-domain requests
2. **Session Security**: Sessions should be domain-aware and secure
3. **HTTPS Enforcement**: All domains should enforce HTTPS in production
4. **Domain Validation**: The application validates domain access for each portal

## Troubleshooting

### Common Issues
1. **Infinite Redirects**: Check middleware configuration and domain detection logic
2. **Session Issues**: Verify session cookies are set for the correct domain
3. **CORS Errors**: Ensure proper CORS configuration for API calls
4. **Domain Mismatch**: Verify DNS configuration and server setup

### Debug Mode
Enable debug logging by setting `NODE_ENV=development` to see detailed domain routing information in the console.
