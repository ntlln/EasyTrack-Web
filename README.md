# EasyTrack Web Application

A Next.js application for luggage tracking and management with multi-domain support.

## Getting Started

Install dependencies:
```bash
npm install
```

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Domain Configuration

### Production Domains
- Main Application: `https://ghe-easytrack.org`
- Admin Portal: `https://admin.ghe-easytrack.org`
- Airline Portal: `https://airline.ghe-easytrack.org`

### Development Domains
- Main Application: `http://localhost:3000`
- Admin Portal: `http://admin.localhost:3000`
- Airline Portal: `http://airline.localhost:3000`

## Local Development Setup

Add entries to your hosts file:
```
127.0.0.1 admin.localhost
127.0.0.1 airline.localhost
```

## Environment Variables

Set these environment variables for production:
```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://ghe-easytrack.org
NEXT_PUBLIC_ADMIN_URL=https://admin.ghe-easytrack.org
NEXT_PUBLIC_AIRLINE_URL=https://airline.ghe-easytrack.org
```

## DNS Configuration

Configure these DNS records:
```
ghe-easytrack.org         → Your server IP
www.ghe-easytrack.org     → Your server IP
admin.ghe-easytrack.org   → Your server IP
airline.ghe-easytrack.org → Your server IP
```

## Deployment

The application supports multi-domain routing with automatic redirects based on the accessed domain. Each portal (admin/airline) has its own domain and layout protection.