import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { TransactionsModule } from './transactions/transactions.module';
import { InvoicesModule } from './invoices/invoices.module';
import { PaymentProvidersModule } from './payment-providers/payment-providers.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { RefundsModule } from './refunds/refunds.module';
import { JwtAuthGuard } from './common/guards';
import { HttpExceptionFilter, PrismaExceptionFilter } from './common/filters';
import {
  AuditLogInterceptor,
  TransformResponseInterceptor,
} from './common/interceptors';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'public'),
      exclude: ['/api/(.*)'],
    }),
    PrismaModule,
    TransactionsModule,
    InvoicesModule,
    PaymentProvidersModule,
    WebhooksModule,
    RefundsModule,
  ],
  providers: [
    // Global guards
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    // Global filters
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_FILTER, useClass: PrismaExceptionFilter },
    // Global interceptors
    { provide: APP_INTERCEPTOR, useClass: TransformResponseInterceptor },
    { provide: APP_INTERCEPTOR, useClass: AuditLogInterceptor },
  ],
})
export class AppModule {}
