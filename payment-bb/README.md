# Payment Building Block (Payment BB)

A GovStack-compliant payment service for handling transactions, invoices, and payment providers.

## 🏗️ Architecture

This is a **Building Block** following the [GovStack](https://www.govstack.global/) architecture principles:

- **Autonomous**: Independent microservice with its own database
- **Generic**: Reusable across different government services
- **Interoperable**: REST APIs with OpenAPI/Swagger documentation
- **Scalable**: Built with NestJS for high performance

## 🚀 Features

### Core Modules

1. **Transactions**
   - Create and manage payment transactions
   - Support multiple payment providers
   - Track transaction status (PENDING, PROCESSING, COMPLETED, FAILED, REFUNDED)
   - Transaction statistics and reporting

2. **Invoices**
   - Generate invoices with line items
   - Automatic invoice numbering
   - Support for taxes and multi-currency
   - Invoice status management (DRAFT, PENDING, PAID, CANCELLED)

3. **Payment Providers**
   - Support for multiple payment gateways:
     - **Stripe**: International card payments
     - **Wave**: Mobile money for Senegal (XOF)
     - **Orange Money**: Mobile money service
     - **PayPal**: Digital wallet payments
   - Enable/disable providers dynamically
   - Provider-specific configuration

4. **Webhooks**
   - Receive payment notifications from providers
   - Automatic transaction status updates
   - Event logging and processing

5. **Refunds**
   - Full or partial refunds
   - Refund tracking and status management
   - Automatic transaction status updates

## 🛠️ Tech Stack

- **Framework**: NestJS 11 + TypeScript
- **Database**: Prisma ORM (SQLite/PostgreSQL)
- **Authentication**: JWT (integrates with Identity BB via OIDC)
- **API Documentation**: OpenAPI/Swagger
- **Payment Providers**: Stripe SDK
- **Validation**: class-validator, class-transformer

## 📦 Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Configure your .env file with:
# - Database connection
# - JWT secret (should match identity-bb)
# - Payment provider credentials
# - Identity BB URL for OIDC integration

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed the database with sample data
npm run prisma:seed
```

## 🏃 Running the Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod

# Debug mode
npm run start:debug
```

The service will be available at:
- API: `http://localhost:3001/api`
- Documentation: `http://localhost:3001/api/docs`

## 📚 API Documentation

Once the application is running, visit `http://localhost:3001/api/docs` for interactive API documentation.

### Main Endpoints

#### Transactions
- `POST /api/transactions` - Create a new transaction
- `GET /api/transactions` - List all transactions
- `GET /api/transactions/:id` - Get transaction details
- `GET /api/transactions/stats` - Get transaction statistics
- `PATCH /api/transactions/:id/complete` - Mark as completed
- `PATCH /api/transactions/:id/fail` - Mark as failed

#### Invoices
- `POST /api/invoices` - Create a new invoice
- `GET /api/invoices` - List all invoices
- `GET /api/invoices/:id` - Get invoice details
- `PATCH /api/invoices/:id/pay` - Mark invoice as paid
- `PATCH /api/invoices/:id/cancel` - Cancel an invoice

#### Payment Providers
- `GET /api/providers` - List payment providers (public)
- `POST /api/providers` - Create a new provider (admin)
- `PATCH /api/providers/:id/activate` - Activate provider
- `PATCH /api/providers/:id/deactivate` - Deactivate provider

#### Refunds
- `POST /api/refunds` - Create a refund
- `GET /api/refunds` - List refunds
- `PATCH /api/refunds/:id/complete` - Mark refund as completed

#### Webhooks (Public endpoints)
- `POST /api/webhooks/stripe` - Stripe webhook
- `POST /api/webhooks/wave` - Wave webhook
- `POST /api/webhooks/orange-money` - Orange Money webhook

## 🔐 Authentication

This Building Block integrates with the **Identity BB** for authentication:

1. Users authenticate via the Identity BB (OIDC flow)
2. Identity BB issues a JWT token
3. Payment BB validates the JWT token for API access
4. User information is extracted from the token

### JWT Configuration

Ensure your JWT secret matches the Identity BB configuration in `.env`:

```env
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
IDENTITY_BB_URL="http://localhost:3000"
```

## 🔗 GovStack Integration

### Integration with Identity BB

```typescript
// Example: Create a transaction for an authenticated user
const response = await fetch('http://localhost:3001/api/transactions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${jwtToken}`, // From Identity BB
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    amount: 50000,
    currency: 'XOF',
    paymentProviderId: 'wave-provider-id',
    description: 'Driver license renewal'
  })
});
```

### Building Block Communication

```
┌─────────────────┐      JWT Auth      ┌─────────────────┐
│   Identity BB   │◄───────────────────►│   Payment BB    │
│   (Port 3000)   │                     │   (Port 3001)   │
└─────────────────┘                     └─────────────────┘
        │                                        │
        │                                        ▼
        │                               ┌─────────────────┐
        │                               │  Payment        │
        └───────────────────────────────►  Providers      │
         OIDC Integration               │  (Stripe, Wave) │
                                        └─────────────────┘
```

## 🌍 Payment Providers Setup

### Stripe
```env
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

### Wave (Senegal Mobile Money)
```env
WAVE_API_KEY="your-wave-api-key"
WAVE_SECRET_KEY="your-wave-secret"
WAVE_WEBHOOK_SECRET="your-webhook-secret"
```

### Orange Money
```env
ORANGE_MONEY_API_KEY="your-orange-money-key"
ORANGE_MONEY_SECRET_KEY="your-orange-money-secret"
```

## 📊 Database Schema

The database includes the following main entities:

- **PaymentProvider**: Payment gateway configurations
- **Transaction**: Payment transactions
- **Invoice**: Invoices with line items
- **InvoiceItem**: Individual invoice items
- **Refund**: Refund requests
- **WebhookEvent**: Webhook event logs
- **AuditLog**: Audit trail for all operations

See `prisma/schema.prisma` for the complete schema.

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 🔒 Security Features

- **Helmet**: Security headers
- **CORS**: Configured for frontend integration
- **JWT Authentication**: Secure API access
- **Input Validation**: class-validator for all DTOs
- **Audit Logging**: Track all mutations
- **Exception Filters**: Sanitized error responses

## 📈 Audit & Compliance

All create, update, and delete operations are automatically logged in the `AuditLog` table:

- User who performed the action
- Resource type and ID
- Before/after values
- Timestamp, IP address, user agent

## 🚧 Production Considerations

1. **Switch to PostgreSQL**:
   - Update `DATABASE_URL` in `.env`
   - Change provider in `prisma/schema.prisma`
   - Use proper array/JSON types
   - Run migrations

2. **Security**:
   - Change `JWT_SECRET` to a strong random value
   - Enable HTTPS
   - Configure proper CORS origins
   - Rotate API keys regularly

3. **Payment Providers**:
   - Use production API keys
   - Configure webhook endpoints
   - Implement proper error handling
   - Set up monitoring and alerts

4. **Scaling**:
   - Use connection pooling
   - Implement caching (Redis)
   - Set up load balancing
   - Monitor performance

## 📝 License

UNLICENSED - Private use only

## 🤝 Contributing

This is part of a GovStack-compliant government services platform. Follow the established patterns and conventions when contributing.

## 📧 Support

For issues and questions, please refer to the project documentation or contact the development team.

---

**GovStack Building Block**: Payment BB v0.0.1
