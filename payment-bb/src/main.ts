import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Security
  app.use(helmet());
  app.enableCors({
    origin: configService.get('FRONTEND_URL') || 'http://localhost:4200',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api');

  // Swagger documentation with OAuth2 (GovStack compliance)
  const identityBBUrl = configService.get('IDENTITY_BB_URL', 'http://localhost:3000');

  const config = new DocumentBuilder()
    .setTitle('GovStack Payment Building Block')
    .setDescription(
      'Payment processing API following GovStack BB specifications.\n\n' +
      '## Features\n' +
      '- Transaction processing with multiple payment providers\n' +
      '- Invoice generation and management\n' +
      '- Refund processing\n' +
      '- Webhook support for external providers\n\n' +
      '## Authentication\n' +
      'This API uses OAuth2 (OpenID Connect) for authentication via the Identity Building Block.\n\n' +
      '**Development Mode:** Use `/api/auth/login` from Identity BB to obtain JWT token.\n\n' +
      '**Production Mode:** Use OAuth2 authorization code flow.\n\n' +
      '## GovStack Compliance\n' +
      '- ✅ OpenAPI 3.1 specification\n' +
      '- ✅ OAuth2/OIDC authentication\n' +
      '- ✅ Information Mediator (IM-BB) integration ready\n' +
      '- ✅ Service registry compatible\n' +
      '- ✅ Audit logging for all operations',
    )
    .setVersion('1.0.0')
    .addTag('transactions', 'Payment transaction operations')
    .addTag('invoices', 'Invoice management')
    .addTag('providers', 'Payment provider configuration')
    .addTag('refunds', 'Refund processing')
    .addTag('webhooks', 'External provider webhooks')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token from Identity BB',
      },
      'JWT',
    )
    .addOAuth2(
      {
        type: 'oauth2',
        description: 'OAuth2 authentication via Identity BB (GovStack standard)',
        flows: {
          authorizationCode: {
            authorizationUrl: `${identityBBUrl}/oauth/authorize`,
            tokenUrl: `${identityBBUrl}/oauth/token`,
            scopes: {
              'payment:read': 'Read payment transactions and invoices',
              'payment:create': 'Create new payment transactions',
              'payment:update': 'Update payment transactions',
              'invoice:read': 'Read invoices',
              'invoice:create': 'Create invoices',
              'invoice:update': 'Update invoices',
              'refund:create': 'Create refund requests',
              'provider:read': 'Read payment provider information',
              'provider:manage': 'Manage payment providers (Admin)',
            },
          },
        },
      },
      'OAuth2',
    )
    .addServer('http://localhost:3001', 'Development - Direct')
    .addServer('http://localhost:8080/api/payment', 'Development - Via API Gateway')
    .addServer('https://api.senrm.gov.sn/api/payment', 'Production - Via API Gateway')
    .setExternalDoc(
      'GovStack Service Registry',
      '/govstack-service-registry.yaml',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      oauth2RedirectUrl: `${configService.get('APP_URL', 'http://localhost:3001')}/api/docs/oauth2-redirect.html`,
    },
  });

  // Health check endpoint (public)
  app.getHttpAdapter().get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      buildingBlock: 'PAYMENT-BB',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  const port = configService.get('PORT') || 3001;
  await app.listen(port);

  console.log(`
╔══════════════════════════════════════════════════════════╗
║       GovStack Payment Building Block (PAYMENT-BB)        ║
╚══════════════════════════════════════════════════════════╝

🚀  Server:      http://localhost:${port}
📚  API Docs:    http://localhost:${port}/api/docs
❤️   Health:      http://localhost:${port}/health
🔐  Identity BB: ${identityBBUrl}

📋  Services:
    - Transactions:     /api/transactions
    - Invoices:         /api/invoices
    - Providers:        /api/providers
    - Refunds:          /api/refunds
    - Webhooks:         /api/webhooks

🏗️   GovStack Compliance:
    ✅ OAuth2/OIDC via Identity BB
    ✅ OpenAPI 3.1 specification
    ✅ IM-BB integration ready
    ✅ Service registry: /govstack-service-registry.yaml

Environment: ${configService.get('NODE_ENV', 'development')}
  `);
}

bootstrap();
