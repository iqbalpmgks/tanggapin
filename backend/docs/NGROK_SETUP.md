# Ngrok Setup Guide for Tanggapin

This guide will help you set up Ngrok for webhook testing with Instagram API integration in the Tanggapin project.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Detailed Setup](#detailed-setup)
- [Configuration Options](#configuration-options)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## Overview

Ngrok creates secure tunnels to your local development server, making it accessible from the internet. This is essential for testing Instagram webhooks, which require a publicly accessible HTTPS endpoint.

### Why Ngrok for Tanggapin?

- **Instagram Webhooks**: Instagram requires HTTPS URLs for webhook endpoints
- **Local Development**: Test webhook integration without deploying to production
- **Real-time Testing**: Receive actual Instagram events during development
- **Secure Tunneling**: HTTPS encryption for webhook data

## Prerequisites

1. **Node.js**: Version 18.0.0 or higher
2. **Ngrok Account**: Free account at [ngrok.com](https://ngrok.com)
3. **Backend Server**: Tanggapin backend running on port 3000
4. **Environment Variables**: Properly configured `.env` file

## Quick Start

### 1. Get Your Ngrok Auth Token

1. Sign up at [ngrok.com](https://ngrok.com)
2. Go to [Your Authtoken](https://dashboard.ngrok.com/get-started/your-authtoken)
3. Copy your authtoken

### 2. Configure Environment Variables

Add your ngrok authtoken to `backend/.env`:

```env
# Ngrok Configuration
NGROK_AUTH_TOKEN=your_ngrok_auth_token_here
NGROK_SUBDOMAIN=tanggapin-dev
NGROK_REGION=us
```

### 3. Start Ngrok Tunnel

```bash
# Navigate to backend directory
cd backend

# Start ngrok tunnel (automated setup)
npm run ngrok

# Alternative: Simple tunnel without setup
npm run ngrok:simple

# With custom subdomain (requires paid plan)
npm run ngrok:subdomain
```

### 4. Update Webhook URL

1. Copy the HTTPS URL from ngrok output (e.g., `https://abc123.ngrok.io`)
2. Update your `.env` file:
   ```env
   WEBHOOK_BASE_URL=https://abc123.ngrok.io
   ```
3. Configure Instagram webhook in Meta Developer Console

## Detailed Setup

### Installation Methods

#### Method 1: Automatic Setup (Recommended)

```bash
# This will install ngrok, configure auth token, and start tunnel
npm run ngrok
```

#### Method 2: Manual Installation

```bash
# Install ngrok globally
npm run ngrok:install

# Or install manually
npm install -g ngrok

# Configure auth token
ngrok config add-authtoken your_auth_token_here

# Start tunnel
ngrok http 3000
```

### Environment Variables

Configure these variables in your `backend/.env` file:

```env
# Required
NGROK_AUTH_TOKEN=your_ngrok_auth_token_here

# Optional
NGROK_SUBDOMAIN=tanggapin-dev          # Custom subdomain (paid plans)
NGROK_REGION=us                        # Server region (us, eu, ap, au, sa, jp, in)
NGROK_LOG_LEVEL=info                   # Log level (debug, info, warn, error)
WEBHOOK_BASE_URL=https://your-url.ngrok.io  # Update after starting tunnel
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run ngrok` | Automated setup with auth token configuration |
| `npm run ngrok:simple` | Basic tunnel without setup |
| `npm run ngrok:subdomain` | Tunnel with custom subdomain |
| `npm run ngrok:setup` | Same as `npm run ngrok` |
| `npm run ngrok:install` | Install ngrok globally |

## Configuration Options

### Basic Configuration

The simplest setup uses environment variables:

```env
NGROK_AUTH_TOKEN=your_token
NGROK_SUBDOMAIN=tanggapin-dev
```

### Advanced Configuration

For advanced setups, use the `ngrok.yml` configuration file:

```yaml
# backend/ngrok.yml
tunnels:
  tanggapin-api:
    addr: 3000
    proto: http
    subdomain: tanggapin-dev
    region: us
    inspect: true
    bind_tls: true
```

Use with:
```bash
ngrok start --config ngrok.yml tanggapin-api
```

### Regional Servers

Choose the region closest to your location:

- `us` - United States
- `eu` - Europe
- `ap` - Asia/Pacific
- `au` - Australia
- `sa` - South America
- `jp` - Japan
- `in` - India

## Instagram Webhook Configuration

### 1. Meta Developer Console Setup

1. Go to [Meta Developer Console](https://developers.facebook.com/apps/)
2. Select your Instagram app
3. Navigate to **Products** → **Webhooks**
4. Add webhook URL: `https://your-ngrok-url.ngrok.io/api/webhook/instagram`
5. Set verify token: Use `INSTAGRAM_WEBHOOK_VERIFY_TOKEN` from your `.env`

### 2. Webhook Endpoints

Tanggapin provides these webhook endpoints:

- `GET /api/webhook/instagram` - Webhook verification
- `POST /api/webhook/instagram` - Webhook events
- `GET /health` - Health check

### 3. Testing Webhooks

```bash
# Test webhook verification
curl "https://your-ngrok-url.ngrok.io/api/webhook/instagram?hub.mode=subscribe&hub.challenge=test&hub.verify_token=your_verify_token"

# Test health endpoint
curl "https://your-ngrok-url.ngrok.io/health"
```

## Troubleshooting

### Common Issues

#### 1. "ngrok: command not found"

**Solution:**
```bash
# Install ngrok
npm run ngrok:install

# Or install manually
npm install -g ngrok
```

#### 2. "Invalid authtoken"

**Solution:**
1. Verify your authtoken at [ngrok dashboard](https://dashboard.ngrok.com/get-started/your-authtoken)
2. Update `NGROK_AUTH_TOKEN` in `.env`
3. Run setup again: `npm run ngrok`

#### 3. "Tunnel not found"

**Solution:**
- Free accounts can only run one tunnel at a time
- Stop other ngrok processes: `pkill ngrok`
- Restart tunnel: `npm run ngrok`

#### 4. "Subdomain not available"

**Solution:**
- Custom subdomains require paid plans
- Use random URL: `npm run ngrok:simple`
- Or choose different subdomain

#### 5. "Connection refused"

**Solution:**
1. Ensure backend server is running: `npm run dev`
2. Check port configuration in `.env`
3. Verify firewall settings

### Debug Mode

Enable debug logging:

```env
NGROK_LOG_LEVEL=debug
```

Or run with verbose output:
```bash
ngrok http 3000 --log debug
```

### Ngrok Web Interface

Access the ngrok web interface at: http://localhost:4040

Features:
- Request/response inspection
- Replay requests
- Traffic analysis
- Tunnel status

## Best Practices

### Security

1. **Use HTTPS**: Always use HTTPS URLs for webhooks
2. **Verify Tokens**: Implement proper webhook verification
3. **Rate Limiting**: Configure rate limits for webhook endpoints
4. **Auth Tokens**: Keep ngrok auth tokens secure

### Development Workflow

1. **Start Backend First**: Always start your backend server before ngrok
2. **Update Environment**: Update `WEBHOOK_BASE_URL` when tunnel URL changes
3. **Use Subdomains**: Use consistent subdomains for easier development
4. **Monitor Requests**: Use ngrok web interface to debug webhook issues

### Performance

1. **Choose Nearest Region**: Select ngrok region closest to your location
2. **Minimize Tunnels**: Use only necessary tunnels
3. **Connection Limits**: Be aware of free plan limitations

### Instagram Integration

1. **Webhook Verification**: Implement proper webhook verification
2. **Event Handling**: Handle all Instagram webhook events gracefully
3. **Error Handling**: Implement retry logic for failed webhook processing
4. **Logging**: Log all webhook events for debugging

## Example Workflow

Here's a complete development workflow:

```bash
# 1. Start backend server
cd backend
npm run dev

# 2. In another terminal, start ngrok
npm run ngrok

# 3. Copy the HTTPS URL (e.g., https://abc123.ngrok.io)

# 4. Update .env file
echo "WEBHOOK_BASE_URL=https://abc123.ngrok.io" >> .env

# 5. Configure Instagram webhook in Meta Developer Console
# URL: https://abc123.ngrok.io/api/webhook/instagram
# Verify Token: (from INSTAGRAM_WEBHOOK_VERIFY_TOKEN in .env)

# 6. Test webhook
curl "https://abc123.ngrok.io/api/webhook/instagram?hub.mode=subscribe&hub.challenge=test&hub.verify_token=your_verify_token"

# 7. Monitor requests at http://localhost:4040
```

## Support

- **Ngrok Documentation**: [ngrok.com/docs](https://ngrok.com/docs)
- **Instagram Webhooks**: [developers.facebook.com/docs/instagram-basic-display-api/webhooks](https://developers.facebook.com/docs/instagram-basic-display-api/webhooks)
- **Tanggapin Issues**: [GitHub Issues](https://github.com/iqbalpmgks/tanggapin/issues)

## Advanced Topics

### Multiple Tunnels

For complex setups, you can run multiple tunnels:

```yaml
# ngrok.yml
tunnels:
  api:
    addr: 3000
    proto: http
  frontend:
    addr: 5173
    proto: http
```

Start all tunnels:
```bash
ngrok start --all
```

### Custom Domains

With paid plans, you can use custom domains:

```yaml
tunnels:
  api:
    addr: 3000
    proto: http
    hostname: api.yourdomain.com
```

### Load Balancing

For high-traffic testing:

```yaml
tunnels:
  api:
    addr: 3000
    proto: http
    load_balance: round_robin
```

---

**Happy tunneling! 🚀**
