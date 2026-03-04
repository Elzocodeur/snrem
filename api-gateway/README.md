# GovStack API Gateway

Centralized API Gateway for routing requests to Building Blocks in the SenRM GovStack platform.

## Architecture

```
External Requests
       ↓
   API Gateway (Nginx:8080)
       ↓
    ┌──┴──┐
    ↓     ↓
Identity  Payment
  BB       BB
(3000)   (3001)
```

## Features

- **Unified Entry Point**: Single endpoint for all Building Block services
- **Security**: Centralized authentication, CORS, rate limiting, security headers
- **Routing**: Intelligent routing based on URL paths
- **Monitoring**: Access logs, health checks
- **GovStack Compliance**: X-Road header passthrough, IM-BB integration ready

## Quick Start

### Using Docker Compose (Recommended)

```bash
# 1. Create .env file
cp .env.example .env

# 2. Start all services
docker-compose up -d

# 3. Check health
curl http://localhost:8080/health
```

### Manual Setup

```bash
# 1. Install Nginx
# Ubuntu/Debian
sudo apt-get install nginx

# Windows
# Download from https://nginx.org/en/download.html

# 2. Copy configuration
sudo cp nginx.conf /etc/nginx/sites-available/govstack
sudo ln -s /etc/nginx/sites-available/govstack /etc/nginx/sites-enabled/

# 3. Test configuration
sudo nginx -t

# 4. Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

## API Routes

### Identity BB

| Route | Upstream | Description |
|-------|----------|-------------|
| `/api/identity/*` | `http://localhost:3000` | Identity BB APIs |
| `/oauth/*` | `http://localhost:3000` | OAuth2/OIDC endpoints |
| `/.well-known/*` | `http://localhost:3000` | OIDC discovery |
| `/docs/identity` | `http://localhost:3000/api/docs` | API Documentation |

### Payment BB

| Route | Upstream | Description |
|-------|----------|-------------|
| `/api/payment/*` | `http://localhost:3001` | Payment BB APIs |
| `/api/payment/webhooks/*` | `http://localhost:3001` | Payment webhooks |
| `/docs/payment` | `http://localhost:3001/api/docs` | API Documentation |

## Rate Limiting

- **General API**: 10 requests/second
- **Authentication**: 5 requests/second
- **Webhooks**: 100 requests/second

## Security Headers

All responses include:
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: no-referrer-when-downgrade`
- Content Security Policy

## CORS Configuration

Default: Allow all origins (development)

For production, update `nginx.conf`:
```nginx
add_header Access-Control-Allow-Origin "https://app.senrm.gov.sn" always;
```

## Information Mediator Integration

The gateway is ready for IM-BB integration. It passes through X-Road headers:
- `X-Road-Client`: Calling Building Block
- `X-Road-Service`: Target service
- `X-Road-Id`: Transaction ID

### Production Mode

Update `docker-compose.yml`:
```yaml
environment:
  - USE_IM_BB=true
  - IM_BB_URL=https://im-bb.senrm.gov.sn
```

## Monitoring

### Health Check

```bash
curl http://localhost:8080/health
```

### Logs

```bash
# Access logs
tail -f logs/govstack-access.log

# Error logs
tail -f logs/govstack-error.log

# Docker logs
docker-compose logs -f api-gateway
```

### Metrics

Consider adding Prometheus exporter:
```nginx
location /metrics {
    stub_status on;
    access_log off;
}
```

## SSL/TLS (Production)

For production with HTTPS:

```nginx
server {
    listen 443 ssl http2;
    server_name api.senrm.gov.sn;

    ssl_certificate /etc/ssl/certs/senrm.crt;
    ssl_certificate_key /etc/ssl/private/senrm.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # ... rest of config
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name api.senrm.gov.sn;
    return 301 https://$server_name$request_uri;
}
```

## Troubleshooting

### Gateway not starting

```bash
# Check nginx configuration
sudo nginx -t

# Check logs
docker-compose logs api-gateway
```

### Building Blocks not reachable

```bash
# Test upstream services
curl http://localhost:3000/health  # Identity BB
curl http://localhost:3001/health  # Payment BB

# Check network
docker network inspect govstack-network
```

### CORS errors

Update `nginx.conf` with your frontend domain:
```nginx
add_header Access-Control-Allow-Origin "https://your-frontend.com" always;
```

## Architecture Diagram

```
┌─────────────────────────────────────────────────┐
│              External Clients                    │
│    (Web Apps, Mobile Apps, Other Services)      │
└──────────────────┬──────────────────────────────┘
                   │
                   │ HTTPS (443)
                   │
┌──────────────────▼──────────────────────────────┐
│            API Gateway (Nginx)                   │
│  ┌────────────────────────────────────────────┐ │
│  │  Security (CORS, Headers, Rate Limiting)   │ │
│  │  Routing (/api/identity, /api/payment)     │ │
│  │  Logging & Monitoring                       │ │
│  │  IM-BB Header Passthrough                   │ │
│  └────────────────────────────────────────────┘ │
└─────────────┬───────────────┬────────────────────┘
              │               │
     ┌────────▼───┐      ┌────▼────────┐
     │ Identity BB│      │ Payment BB  │
     │   :3000    │      │   :3001     │
     └────────────┘      └─────────────┘
```

## GovStack Compliance

✅ Centralized security and access control
✅ OpenAPI 3.1 documentation accessible
✅ OAuth2/OIDC integration
✅ X-Road header support for IM-BB
✅ Service-level rate limiting
✅ Audit logging
✅ Health monitoring

## Support

For issues or questions, contact the SenRM development team.
