# SenRM - GovStack Building Blocks Platform

## Identified blocks
- identity
  - entity_type: user/team
- payments
- messaging
- consent
- wallet: licenses

A digital government services platform built following the **GovStack Building Blocks methodology**, providing interoperable and reusable digital components for citizen services.

## GovStack Methodology

[GovStack](https://govstack.global/) is a global initiative led by BMZ, GIZ, Estonia, ITU, and DIAL that provides a framework for building interoperable digital government services through reusable components called **Building Blocks**.

### What Are Building Blocks?

Building Blocks are software modules that each provide a standalone, reusable service. They follow four key principles:

| Principle | Description |
|-----------|-------------|
| **Autonomous** | Each block provides a standalone, reusable service and can operate independently |
| **Generic** | Blocks are flexible across use cases and government sectors |
| **Interoperable** | Blocks can combine, connect, and interact with other blocks via standard APIs |
| **Iteratively Evolvable** | Blocks can be improved while being used as part of running solutions |

Each Building Block represents the minimum required functionality (MVP) for its domain, and blocks are composed together to deliver complete government services.

### How This Project Applies GovStack

This platform implements the GovStack approach by decomposing government services into independent building blocks that communicate through well-defined APIs. Each block is a self-contained NestJS service with its own database, authentication context, and API surface.

**Current building blocks:**

1. **Identity BB** - User identity, authentication, and authorization
2. **License Renewal BB** - License renewal workflows for citizens

## Goals: GovStack Level 2 Compliance

This project targets **GovStack Level 2 compliance**, meaning the software requires minimal integration efforts and is highly aligned with GovStack BB Specifications.

### Compliance Levels

| Level | Deployment | API Services | Functional Requirements |
|-------|-----------|--------------|------------------------|
| **Level 1** | Deployable via container | >= 1 API service requirement fulfilled | > 50% of cross-cutting and functional requirements met |
| **Level 2** | Deployable via container | All API service requirements fulfilled | > 90% of cross-cutting and functional requirements met |

### Level 2 Checklist

- [x] **Containerized deployment** - Docker/OCI container packaging
- [x] **API-first design** - RESTful APIs with OpenAPI/Swagger documentation
- [x] **OpenID Connect** - OIDC provider for federated identity + social login (Google, Facebook, etc.)
- [x] **Role-Based Access Control** - Granular RBAC with permission-based access
- [x] **Audit logging** - Comprehensive logging of all mutating operations
- [x] **Input validation** - Strict request validation with whitelist mode
- [x] **Security hardening** - Helmet, CORS, token rotation with replay detection
- [ ] **100% API spec coverage** - All GovStack Identity BB API endpoints implemented
- [ ] **Information Mediator** - Federated communication between building blocks
- [ ] **Microservices architecture** - Each BB as an independent deployable service
- [ ] **Asynchronous messaging** - Event-driven communication between blocks
- [ ] **Multi-interface support** - Web, mobile, and SMS interfaces
- [ ] **Offline/low-bandwidth support** - Operate in low-resource settings
- [ ] **Right to be forgotten** - Full data deletion capability
- [ ] **Regular security scanning** - Automated vulnerability scanning in CI/CD

### Cross-Cutting Requirements

To reach > 90% compliance, each building block must satisfy:

- **Open standards** - REST APIs, OpenAPI specs, open-source dependencies
- **Cloud-native** - Containerized, stateless, horizontally scalable
- **Citizen-centric** - User-centered design with data deletion rights
- **Secure** - Audited, scanned, with comprehensive logging and exception handling
- **Accessible** - Multiple interface support (web, mobile, SMS/voice)
- **Robust** - Asynchronous patterns, eventual consistency, low-bandwidth tolerance

## Architecture Overview

- Service discovery
- API gateway
- Auto scaling
- Monitoring
- Modules will have a front end, back end and shared folders to share types

## Building Blocks

### 1. Identity Building Block (`identity-bb/`)

The foundational block that handles user identity, authentication, and authorization for all other blocks.

**Capabilities:**

- User registration and management (with national ID support)
- JWT-based authentication (access tokens + refresh tokens with replay detection)
- Local login on `localhost` with email/password
- OpenID Connect (OIDC) provider for federated identity
- OIDC consumer for social login (Google, Facebook, and any OIDC-compliant provider)
- Role-Based Access Control (RBAC) with 4 system roles
- Permission-Based Access Control (PBAC) using `resource:action` format
- Comprehensive audit logging for all mutating operations

**System Roles:**

| Role | Description |
|------|-------------|
| `SUPER_ADMIN` | Full system access |
| `ADMIN` | Day-to-day operations management |
| `AGENT` | Government agent processing identity requests |
| `CITIZEN` | Access to own profile only |

**API Endpoints:**

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/v1/auth/register` | Register a new user | Public |
| `POST` | `/api/v1/auth/login` | Login with email/password | Public |
| `POST` | `/api/v1/auth/refresh` | Refresh access token | Public |
| `POST` | `/api/v1/auth/logout` | Logout and revoke tokens | Authenticated |
| `GET` | `/api/v1/auth/profile` | Get current user profile | Authenticated |
| `GET` | `/api/v1/users` | List users (paginated) | `users:read` |
| `GET` | `/api/v1/users/:id` | Get user by ID | `users:read` |
| `POST` | `/api/v1/users` | Create user | `users:create` |
| `PATCH` | `/api/v1/users/:id` | Update user | `users:update` |
| `DELETE` | `/api/v1/users/:id` | Deactivate user | `users:delete` |
| `POST` | `/api/v1/users/:id/roles` | Assign role to user | `users:update` |
| `DELETE` | `/api/v1/users/:id/roles/:roleId` | Remove role from user | `users:update` |
| `GET` | `/api/v1/roles` | List all roles | `roles:read` |
| `POST` | `/api/v1/roles` | Create role | `roles:create` |
| `PATCH` | `/api/v1/roles/:id` | Update role | `roles:update` |
| `DELETE` | `/api/v1/roles/:id` | Delete role | `roles:delete` |
| `POST` | `/api/v1/roles/:id/permissions` | Assign permissions | `roles:update` |
| `GET` | `/api/v1/permissions` | List all permissions | `permissions:read` |
| `POST` | `/api/v1/permissions` | Create permission | `permissions:create` |
| `DELETE` | `/api/v1/permissions/:id` | Delete permission | `permissions:delete` |

**OIDC Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/.well-known/openid-configuration` | OIDC discovery document |
| `GET` | `/.well-known/jwks.json` | JSON Web Key Set |
| `GET` | `/oidc/authorize` | Authorization endpoint |
| `POST` | `/oidc/token` | Token exchange |
| `GET` | `/oidc/userinfo` | User info endpoint |
| `POST` | `/oidc/client-mgmt/oidc-client` | Register OIDC client |
| `PUT` | `/oidc/client-mgmt/oidc-client/:id` | Update OIDC client |

### 2. License Renewal Building Block

A citizen-facing block for managing license renewal workflows. This block integrates with the Identity BB for authentication and user verification.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** NestJS 11
- **Language:** TypeScript
- **ORM:** Prisma 5
- **Database:** SQLite (development) / PostgreSQL (production)
- **Auth:** Passport.js + JWT + OIDC
- **Docs:** Swagger/OpenAPI

## Getting Started

### Prerequisites

- Node.js >= 22.21
- npm

### Setup

```bash
# 1. Install dependencies
cd identity-bb
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env as needed

# 3. Run database migrations and seed
npx prisma migrate dev --name init
npm run prisma:seed

# 4. Start the server
npm run start:dev
```

The API will be available at `http://localhost:3000` and the Swagger UI at `http://localhost:3000/api/docs`.

### Default Admin Credentials

| Field | Value |
|-------|-------|
| Email | `admin@govstack.local` |
| Password | `Admin@123456` |

> Change these in `.env` before deploying to any non-local environment.

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Database connection string | `file:./dev.db` |
| `JWT_SECRET` | Secret key for signing JWTs | *(required)* |
| `OIDC_ISSUER` | OIDC issuer URL | `http://localhost:3000` |
| `PORT` | Server port | `3000` |
| `CORS_ORIGIN` | Allowed CORS origins | `*` |
| `ADMIN_EMAIL` | Default admin email (seed) | `admin@govstack.local` |
| `ADMIN_PASSWORD` | Default admin password (seed) | `Admin@123456` |

### Switching to PostgreSQL

1. In `prisma/schema.prisma`, change the provider from `sqlite` to `postgresql`
2. Update `String` JSON fields in `OidcClient` model back to `String[]`
3. Set `DATABASE_URL` in `.env` to a PostgreSQL connection string
4. Delete `prisma/migrations/` and re-run: `npx prisma migrate dev --name init`

## Project Structure

```
senrm/
├── README.md                  # This file
├── identity-bb/               # Identity Building Block
│   ├── src/
│   │   ├── main.ts            # App bootstrap + Swagger setup
│   │   ├── app.module.ts      # Root module (guards, filters, interceptors)
│   │   ├── auth/              # Authentication (register, login, JWT, refresh tokens)
│   │   ├── oidc/              # OpenID Connect provider
│   │   ├── users/             # User CRUD + role assignment
│   │   ├── roles/             # Role CRUD + permission assignment
│   │   ├── permissions/       # Permission CRUD
│   │   ├── prisma/            # Prisma database service
│   │   └── common/            # Shared guards, filters, interceptors, decorators, DTOs
│   ├── prisma/
│   │   ├── schema.prisma      # Data models
│   │   └── seed.ts            # Default roles, permissions, admin user
│   └── package.json
└── .gitignore
```

## Security Architecture

The Identity BB applies a layered security model through global NestJS guards, executed in order:

1. **JWT Authentication Guard** - Validates the bearer token on every request (public routes opt out via `@Public()` decorator)
2. **Roles Guard** - Checks that the user has the required role (via `@Roles()` decorator)
3. **Permissions Guard** - Checks that the user's roles grant the required `resource:action` permission (via `@RequirePermissions()` decorator)

Additional security measures:

- **Helmet** middleware for HTTP header hardening
- **CORS** configuration
- **Input validation** via `class-validator` with whitelist mode (unknown fields are stripped)
- **Refresh token rotation** with family-based replay detection
- **Audit logging** interceptor capturing all POST/PUT/PATCH/DELETE operations

## References

- [GovStack Initiative](https://govstack.global/)
- [GovStack Specifications](https://govstack.gitbook.io/specification)
- [GovStack Identity BB Specification](https://govstack.gitbook.io/specification/building-blocks/identity-and-verification)
- [NestJS Documentation](https://docs.nestjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)
