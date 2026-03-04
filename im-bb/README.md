# Information Mediator Building Block (IM-BB)

GovStack-compliant Information Mediator based on X-Road technology for secure inter-BB communication.

## 🎯 Purpose

The IM-BB is a **centralized gateway** for all communication between Building Blocks in production. It provides:

- 🔐 **Encrypted communication** between Building Blocks
- 📝 **Digital signatures** for non-repudiation
- 📊 **Centralized audit trail** of all inter-BB messages
- 🔍 **Service discovery** and registry
- ✅ **GovStack compliance**

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────┐
│          All Building Blocks                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │Identity  │  │ Payment  │  │Messaging │      │
│  │   BB     │  │   BB     │  │   BB     │      │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘      │
│       │             │             │             │
│       └─────────────┼─────────────┘             │
└───────────────────── ┼──────────────────────────┘
                       │
                       │ All traffic goes through
                       ▼
            ┌─────────────────────┐
            │  Information        │
            │   Mediator (IM-BB)  │
            │                     │
            │  - X-Road Security  │
            │  - Service Registry │
            │  - Audit Logs       │
            └─────────────────────┘
```

## 🚀 Quick Start

### Development Mode (Skip IM-BB)

For local development, you can skip the IM-BB and use direct HTTP:

```bash
# In each BB's .env file
USE_IM_BB=false
IDENTITY_BB_URL=http://localhost:3000
PAYMENT_BB_URL=http://localhost:3001
```

BBs will communicate directly via HTTP.

### Production Mode (Use IM-BB)

#### 1. Start the IM-BB

```bash
cd im-bb

# Copy environment file
cp .env.example .env

# Edit configuration
nano .env

# Start IM-BB
docker-compose up -d

# Check status
docker-compose ps
```

#### 2. Configure Building Blocks

Update each BB's `.env`:

```bash
# Enable IM-BB mode
USE_IM_BB=true

# IM-BB URL (same for all BBs)
IM_BB_URL=https://im-bb.senrm.gov.sn

# BB-specific configuration
IM_BB_CLIENT_ID=PAYMENT-BB
IM_BB_INSTANCE=SN/GOV/SENRM/PAYMENT-BB
```

#### 3. Register Services

Each BB registers its services with the IM-BB:

```bash
# From payment-bb directory
curl -X POST http://localhost:8080/api/registry \
  -H "Content-Type: application/json" \
  -d @govstack-service-registry.yaml
```

## 📋 Components

### 1. X-Road Security Server

**Port:** 8080
**Purpose:** Main messaging gateway
**Technology:** NIIS X-Road 7.3

```
http://localhost:8080
```

### 2. X-Road Admin UI

**Port:** 8443 (HTTPS)
**Purpose:** Configuration and management
**Credentials:** See `.env` file

```
https://localhost:8443
Username: xrd
Password: secret (change in production!)
```

### 3. Service Registry UI

**Port:** 8081
**Purpose:** Browse available services

```
http://localhost:8081
```

### 4. Monitoring Stack

**Prometheus:** Port 9090
**Grafana:** Port 3000

```
http://localhost:9090  # Prometheus
http://localhost:3000  # Grafana (admin/admin)
```

## 🔧 Configuration

### X-Road Instance Identifiers

Format: `COUNTRY/ORGANIZATION/INSTANCE/SUBSYSTEM`

**Examples:**
```
SN/GOV/SENRM/IDENTITY-BB
SN/GOV/SENRM/PAYMENT-BB
SN/GOV/SENRM/MESSAGING-BB
```

Where:
- **SN**: Senegal (country code)
- **GOV**: Government
- **SENRM**: Organization (SenRM)
- **IDENTITY-BB**: Building Block subsystem

### Environment Variables

```env
# X-Road Configuration
XROAD_TOKEN_PIN=1234567890
XROAD_ADMIN_USER=xrd
XROAD_ADMIN_PASSWORD=change-this

# Instance
INSTANCE_IDENTIFIER=SN/GOV/SENRM

# Database
XROAD_DB_PWD=change-this

# Ports
SECURITY_SERVER_PORT=8080
ADMIN_UI_PORT=8443
```

## 📡 How BBs Communicate via IM-BB

### Without IM-BB (Development)

```typescript
// Direct HTTP call
const response = await fetch('http://localhost:3000/api/users/me', {
  headers: { Authorization: `Bearer ${token}` }
});
```

### With IM-BB (Production)

```typescript
// Via ImBbService (automatic)
const user = await this.imBbService.callBuildingBlock(
  'IDENTITY-BB',
  '/api/users/me',
  {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` }
  }
);
```

**What happens under the hood:**

```
Payment BB
    ↓ Creates request with X-Road headers
    │ X-Road-Client: SN/GOV/SENRM/PAYMENT-BB
    │ X-Road-Service: SN/GOV/SENRM/IDENTITY-BB/api/users/me
    │ X-Road-Id: unique-transaction-id
    ↓
IM-BB Security Server
    ↓ Validates client
    ↓ Signs message
    ↓ Encrypts payload
    ↓ Routes to Identity BB
    ↓ Logs to audit trail
    ↓
Identity BB
    ↓ Receives request
    ↓ Processes
    ↓ Returns response
    ↓
IM-BB Security Server
    ↓ Signs response
    ↓ Encrypts
    ↓ Returns to Payment BB
    ↓
Payment BB receives response
```

## 🔐 Security Features

### 1. Message Signing

All messages are digitally signed:
- **Non-repudiation**: Proof of who sent what
- **Integrity**: Message hasn't been tampered with

### 2. Encryption

Messages encrypted in transit:
- TLS between BB and IM-BB
- X-Road encryption between IM-BB instances

### 3. Audit Trail

Complete audit log of all messages:
- Who called whom
- When
- What data
- Response status

### 4. Access Control

IM-BB enforces:
- Service-level access control
- Client authentication
- Rate limiting

## 📊 Monitoring

### Prometheus Metrics

```bash
# View metrics
curl http://localhost:8080/metrics

# Example metrics:
# - xroad_messages_total
# - xroad_message_duration_seconds
# - xroad_errors_total
```

### Grafana Dashboards

Access Grafana at `http://localhost:3000`

**Default dashboards:**
- X-Road Overview
- Service Performance
- Error Rates
- Audit Trail

## 🧪 Testing

### 1. Health Check

```bash
curl http://localhost:8080/
# Should return: X-Road Security Server is running
```

### 2. Test Inter-BB Communication

```bash
# From Payment BB
curl -X POST http://localhost:8080/r1/SN/GOV/SENRM/IDENTITY-BB/api/users/me \
  -H "X-Road-Client: SN/GOV/SENRM/PAYMENT-BB" \
  -H "X-Road-Service: SN/GOV/SENRM/IDENTITY-BB/api/users/me" \
  -H "X-Road-Id: test-123" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. View Audit Logs

```bash
docker-compose logs -f xroad-security-server
```

## 🔄 Switching Modes

### Development → Production

**1. Update all BB `.env` files:**

```bash
# OLD (Development)
USE_IM_BB=false
IDENTITY_BB_URL=http://localhost:3000

# NEW (Production)
USE_IM_BB=true
IM_BB_URL=https://im-bb.senrm.gov.sn
IM_BB_CLIENT_ID=PAYMENT-BB
IM_BB_INSTANCE=SN/GOV/SENRM/PAYMENT-BB
IDENTITY_BB_INSTANCE=SN/GOV/SENRM/IDENTITY-BB
```

**2. Restart all BBs:**

```bash
# Each BB will log on startup:
╔════════════════════════════════════════════════════╗
║  Information Mediator Configuration               ║
╠════════════════════════════════════════════════════╣
║  Mode: IM-BB                                       ║
║  Client: PAYMENT-BB                                ║
║  IM-BB URL: https://im-bb.senrm.gov.sn            ║
╚════════════════════════════════════════════════════╝
```

**3. Verify communication:**

```bash
# Check IM-BB logs for messages
docker-compose -f im-bb/docker-compose.yml logs -f

# Should see:
# [IM-BB] Message: PAYMENT-BB → IDENTITY-BB/api/users/me
```

## 📁 Directory Structure

```
im-bb/
├── docker-compose.yml      # Main deployment file
├── .env.example            # Environment template
├── config/
│   ├── prometheus.yml      # Prometheus config
│   └── globalconf/         # X-Road global configuration
├── docker/
│   └── Dockerfile          # Custom X-Road image (if needed)
├── docs/
│   └── architecture.md     # Detailed architecture
└── README.md               # This file
```

## 🆘 Troubleshooting

### IM-BB not starting

```bash
# Check logs
docker-compose logs xroad-security-server

# Common issues:
# 1. Port already in use
docker-compose down
docker-compose up -d

# 2. Database not ready
docker-compose restart xroad-db
docker-compose restart xroad-security-server
```

### BBs can't connect to IM-BB

```bash
# 1. Verify IM-BB is running
curl http://localhost:8080/

# 2. Check BB configuration
# In payment-bb/.env:
echo $IM_BB_URL  # Should match IM-BB address

# 3. Check network connectivity
docker network inspect im-bb-network
```

### Messages not routing

```bash
# 1. Check service registration
curl http://localhost:8081/services

# 2. Verify X-Road headers
# Must include:
# - X-Road-Client
# - X-Road-Service
# - X-Road-Id

# 3. Check IM-BB logs
docker-compose logs -f xroad-security-server
```

## 🔄 Maintenance

### Backup

```bash
# Backup configuration
docker-compose exec xroad-security-server \
  tar czf /tmp/xroad-backup.tar.gz /etc/xroad

docker cp im-bb-security-server:/tmp/xroad-backup.tar.gz ./backups/

# Backup database
docker-compose exec xroad-db pg_dump -U xroad serverconf \
  > backups/xroad-db-$(date +%Y%m%d).sql
```

### Updates

```bash
# Pull latest images
docker-compose pull

# Restart with new images
docker-compose up -d
```

## 📚 Additional Resources

- [GovStack IM-BB Specification](https://govstack.gitbook.io/bb-information-mediator/)
- [X-Road Documentation](https://x-road.global/documentation)
- [X-Road GitHub](https://github.com/nordic-institute/X-Road)
- [NIIS (Nordic Institute for Interoperability Solutions)](https://niis.org/)

## 🏢 Production Deployment

For production deployment with high availability:

1. **Multi-node setup**: Deploy multiple Security Servers
2. **Load balancing**: Use HAProxy or similar
3. **Database replication**: PostgreSQL primary-replica
4. **Monitoring**: Full Prometheus + Grafana stack
5. **Backups**: Automated daily backups
6. **SSL/TLS**: Proper certificates from trusted CA

See `docs/production-deployment.md` for detailed instructions.

---

**Maintained by:** SenRM Development Team
**Last Updated:** 2026-02-17
**Version:** 1.0.0
**GovStack Compliant:** ✅
