# LoanGenius Deployment Guide

## Domain Configuration for Replit Deployment

When deploying to Replit, you'll need to configure TWO custom domains:

### 1. Main Domain: loangenius.ai
- This will serve the public-facing website
- Configure this as your primary domain in Replit Deployments

### 2. App Subdomain: app.loangenius.ai
- This will serve the loan origination application
- Add this as an additional custom domain in Replit Deployments

## How It Works

The application automatically detects which domain is being accessed and serves the appropriate content:

- **loangenius.ai** → Public website (marketing, pricing, company info)
- **app.loangenius.ai** → Full LOS application (dashboard, pipeline, contacts, etc.)

## Replit Deployment Steps

1. Click the "Deploy" button in Replit
2. In the deployment settings:
   - Add `loangenius.ai` as a custom domain
   - Add `app.loangenius.ai` as an additional custom domain
3. Update your DNS records:
   - Point `loangenius.ai` to Replit's servers
   - Point `app.loangenius.ai` to the same Replit deployment

## The Routing Logic

The server automatically handles routing based on the host header:
- Requests to `app.loangenius.ai` get the React application
- Requests to `loangenius.ai` get the public website
- All API endpoints work on both domains

## Testing Before Deployment

In your Replit development environment:
- Access the public site at the root URL
- Access the app by adding `/app` or `?app=true` to the URL

## Environment Variables

Make sure these are set in your Replit deployment:
- `DATABASE_URL` - Your PostgreSQL connection string
- `OPENAI_API_KEY` - For AI features
- Any other API keys you're using

## Post-Deployment Verification

After deploying:
1. Visit https://loangenius.ai - Should show the public website
2. Visit https://app.loangenius.ai - Should show the login/dashboard
3. Test API endpoints on both domains
4. Verify all features work correctly

The routing is already configured and will work automatically once the domains are set up!