# GovStack Building Block Integration Guide

This document explains how the Identity BB and Payment BB are integrated following GovStack architecture principles.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      External Applications                       │
│              (Web Apps, Mobile Apps, Services)                   │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           │ HTTPS
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                     API Gateway (Port 8080)                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  • Security (CORS, Headers, Rate Limiting)                 │ │
│  │  • Routing (/api/identity, /api/payment)                   │ │
│  │  • X-Road Header Passthrough (IM-BB ready)                 │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────┬───────────────────────┬──────────────────────────┘
              │                       │
              │                       │
┌─────────────▼────────┐    ┌────────▼──────────────┐
│   Identity BB        │    │    Payment BB         │
│   (Port 3000)        │◄───┤    (Port 3001)        │
│                      │    │                       │
│ • User Management    │    │ • Transactions        │
│ • Authentication     │    │ • Invoices            │
│ • OAuth2/OIDC        │    │ • Payment Providers   │
│ • Roles/Permissions  │    │ • Refunds             │
│ • JWT Issuance       │    │ • Webhooks            │
└──────────────────────┘    └───────────────────────┘
         │                           │
         │                           │
    ┌────▼─────┐              ┌──────▼──────┐
    │ Identity │              │  Payment    │
    │ Database │              │  Database   │
    └──────────┘              └─────────────┘
```

## 🔐 Authentication Flow (GovStack Standard)

### 1. User Login (OAuth2/OIDC)

```
User → Identity BB → JWT Token
```

**Steps:**
1. User sends credentials to Identity BB
2. Identity BB validates credentials
3. Identity BB issues JWT token with:
   - User ID (`sub`)
   - Roles and permissions
   - Partner Specific User Token (PSUT)
   - Expiration time

**Example Request:**
```bash
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Example Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 900,
  "refresh_token": "refresh_token_here"
}
```

### 2. Accessing Payment BB with JWT

```
User → Payment BB (with JWT) → Payment BB validates JWT → Response
```

**Example Request:**
```bash
GET http://localhost:3001/api/transactions
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Token Validation:**
- Payment BB validates JWT signature using shared `JWT_SECRET`
- Checks token expiration
- Verifies issuer (`IDENTITY_BB_URL`)
- Extracts user information from payload

## 🔄 Inter-BB Communication Patterns

### Development Mode (Co-located BBs)

Direct HTTP communication between Building Blocks:

```
Payment BB → HTTP Request → Identity BB
```

```typescript
// Example: Payment BB calling Identity BB directly
const response = await fetch('http://localhost:3000/api/users/me', {
  headers: {
    'Authorization': `Bearer ${userToken}`
  }
});
```

### Production Mode (with Information Mediator)

All cross-BB communication goes through IM-BB:

```
Payment BB → IM-BB (X-Road) → Identity BB
```

```typescript
// Example: Using ImBbService
const userInfo = await this.imBbService.callBuildingBlock(
  'IDENTITY-BB',
  '/api/users/me',
  {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` }
  }
);
```

**X-Road Headers:**
- `X-Road-Client`: `PAYMENT-BB`
- `X-Road-Service`: `IDENTITY-BB/api/users/me`
- `X-Road-Id`: Unique transaction ID
- `X-Road-UserId`: User identifier

## 📋 Service Registry

Both Building Blocks register their services with the Information Mediator.

### Payment BB Services

See [`govstack-service-registry.yaml`](./payment-bb/govstack-service-registry.yaml) for complete service definitions:

- `payment-transaction-create`: Create transactions
- `payment-transaction-list`: List transactions
- `payment-invoice-create`: Create invoices
- `payment-provider-list`: List payment providers
- `payment-refund-create`: Create refunds
- Webhook endpoints for external providers

### Identity BB Services

- `user-authentication`: Login/logout
- `user-info`: Get user information
- `token-validation`: Validate JWT tokens
- `user-management`: CRUD operations on users
- `role-management`: Manage roles and permissions

## 🔑 Configuration

### Shared Configuration

Both BBs must share the same JWT secret for token validation:

**identity-bb/.env:**
```env
JWT_SECRET=your-super-secret-jwt-key-change-in-production
PORT=3000
```

**payment-bb/.env:**
```env
JWT_SECRET=your-super-secret-jwt-key-change-in-production
PORT=3001
IDENTITY_BB_URL=http://localhost:3000
```

### Information Mediator Configuration

For production with IM-BB:

**payment-bb/.env:**
```env
USE_IM_BB=true
IM_BB_URL=https://im-bb.senrm.gov.sn
IM_BB_CLIENT_ID=PAYMENT-BB
```

## 🚀 Deployment Scenarios

### Scenario 1: Development (Direct Communication)

```bash
# Terminal 1: Start Identity BB
cd identity-bb
npm run start:dev

# Terminal 2: Start Payment BB
cd payment-bb
npm run start:dev

# Terminal 3: (Optional) Start API Gateway
cd api-gateway
docker-compose up
```

**Access:**
- Identity BB: http://localhost:3000
- Payment BB: http://localhost:3001
- API Gateway: http://localhost:8080

### Scenario 2: Production (with IM-BB)

```bash
# Start all services with Docker Compose
cd api-gateway
docker-compose up -d

# Services will communicate via IM-BB
```

**Architecture:**
```
External → API Gateway → IM-BB → Building Blocks
```

## 📡 API Usage Examples

### Example 1: Create a Transaction

```bash
# 1. Login to get token
curl -X POST http://localhost:8080/api/identity/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'

# Response: { "access_token": "eyJ..." }

# 2. Create transaction with token
curl -X POST http://localhost:8080/api/payment/transactions \
  -H "Authorization: Bearer eyJ..." \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 50000,
    "currency": "XOF",
    "paymentProviderId": "provider-id",
    "description": "Driver license renewal"
  }'
```

### Example 2: Get User's Transactions

```bash
curl -X GET http://localhost:8080/api/payment/transactions \
  -H "Authorization: Bearer eyJ..."
```

### Example 3: Create Invoice

```bash
curl -X POST http://localhost:8080/api/payment/invoices \
  -H "Authorization: Bearer eyJ..." \
  -H "Content-Type: application/json" \
  -d '{
    "subtotal": 50000,
    "taxAmount": 9000,
    "totalAmount": 59000,
    "currency": "XOF",
    "items": [
      {
        "description": "Driver License Renewal",
        "quantity": 1,
        "unitPrice": 50000
      }
    ]
  }'
```

## 🔒 Security Best Practices

### 1. JWT Token Security

- ✅ Use strong `JWT_SECRET` (minimum 32 characters)
- ✅ Short expiration time (15 minutes for access tokens)
- ✅ Refresh tokens for long-lived sessions
- ✅ Validate token on every request
- ✅ Check token issuer and audience

### 2. HTTPS/TLS

- ✅ Use HTTPS in production
- ✅ TLS 1.2+ only
- ✅ Valid SSL certificates

### 3. CORS Configuration

```typescript
// Development: Allow all origins
app.enableCors({ origin: '*' });

// Production: Specific origins only
app.enableCors({
  origin: ['https://app.senrm.gov.sn'],
  credentials: true
});
```

### 4. Rate Limiting

API Gateway implements rate limiting:
- General APIs: 10 req/s
- Authentication: 5 req/s
- Webhooks: 100 req/s

### 5. Input Validation

Both BBs use `class-validator` for DTO validation:

```typescript
export class CreateTransactionDto {
  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  currency: string;

  @IsUUID()
  paymentProviderId: string;
}
```

## 📊 Monitoring and Audit

### Audit Logging

Both BBs automatically log all operations:

```typescript
// Automatic via AuditLogInterceptor
{
  action: 'CREATE',
  resource: 'transactions',
  resourceId: 'txn-123',
  userId: 'user-456',
  imBbTransactionId: 'PAYMENT-BB-1234567890',
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0...',
  createdAt: '2026-02-17T10:30:00Z'
}
```

### Health Checks

```bash
# Check all services
curl http://localhost:8080/health           # API Gateway
curl http://localhost:3000/health           # Identity BB
curl http://localhost:3001/health           # Payment BB
```

### Logs

```bash
# Identity BB logs
cd identity-bb && npm run start:dev

# Payment BB logs
cd payment-bb && npm run start:dev

# API Gateway logs
tail -f api-gateway/logs/govstack-access.log
```

## 🧪 Testing Integration

### Test Authentication Flow

```bash
# 1. Create test user (via Identity BB)
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "firstName": "Test",
    "lastName": "User"
  }'

# 2. Login
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}' \
  | jq -r '.access_token')

# 3. Access Payment BB
curl -X GET http://localhost:3001/api/transactions \
  -H "Authorization: Bearer $TOKEN"
```

### Test IM-BB Integration

```bash
# Enable IM-BB mode
export USE_IM_BB=true
export IM_BB_URL=http://localhost:9000

# Requests will include X-Road headers
curl -X GET http://localhost:3001/api/transactions \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Road-Client: TEST-CLIENT" \
  -H "X-Road-Service: PAYMENT-BB/api/transactions"
```

## 📚 Additional Resources

- [GovStack Architecture Specification](https://govstack.gitbook.io/specification/)
- [Information Mediator Building Block](https://govstack.gitbook.io/bb-information-mediator/)
- [Identity Building Block](https://identity.govstack.global/)
- [Payment Building Block](https://govstack.gitbook.io/bb-payments/)
- [X-Road Documentation](https://x-road.global/)

## 🆘 Troubleshooting

### Issue: JWT Token Invalid

**Symptoms:** 401 Unauthorized errors

**Solutions:**
1. Verify `JWT_SECRET` matches in both BBs
2. Check token expiration
3. Verify `IDENTITY_BB_URL` is correct
4. Check token payload structure

### Issue: CORS Errors

**Symptoms:** Browser console shows CORS errors

**Solutions:**
1. Update CORS origin in both BBs
2. Ensure preflight OPTIONS requests are handled
3. Check API Gateway CORS headers

### Issue: IM-BB Connection Failed

**Symptoms:** Cannot connect to Identity BB from Payment BB

**Solutions:**
1. Verify `IDENTITY_BB_URL` is accessible
2. Check network connectivity
3. Verify IM-BB is running (if enabled)
4. Check X-Road configuration

### Issue: Service Not Found

**Symptoms:** 404 errors via API Gateway

**Solutions:**
1. Verify service is registered in `govstack-service-registry.yaml`
2. Check API Gateway routing in `nginx.conf`
3. Ensure Building Block is running
4. Check URL paths match routing rules

## ✅ GovStack Compliance Checklist

- ✅ **OpenAPI 3.1**: Both BBs provide OpenAPI specifications
- ✅ **OAuth2/OIDC**: Identity BB implements OIDC provider
- ✅ **JWT**: Standard JWT tokens for authentication
- ✅ **REST APIs**: All communication via REST APIs
- ✅ **Service Registry**: Services registered in YAML format
- ✅ **IM-BB Ready**: X-Road header support implemented
- ✅ **API Gateway**: Centralized access control
- ✅ **Audit Logging**: All operations logged
- ✅ **Health Monitoring**: Health check endpoints
- ✅ **Security Headers**: Helmet.js security headers
- ✅ **Rate Limiting**: Implemented in API Gateway
- ✅ **CORS**: Configurable CORS policies
- ✅ **Documentation**: Comprehensive API docs

## 📝 Next Steps

1. ✅ Complete Payment BB implementation
2. ⏳ Implement Messaging BB (notifications)
3. ⏳ Implement Consent BB (data privacy)
4. ⏳ Implement Wallet BB (digital licenses)
5. ⏳ Deploy to production with actual IM-BB
6. ⏳ Integrate with X-Road Security Server
7. ⏳ Add monitoring (Prometheus/Grafana)
8. ⏳ Implement CI/CD pipeline

---

**Maintainer:** SenRM Development Team
**Last Updated:** 2026-02-17
**Version:** 1.0.0
