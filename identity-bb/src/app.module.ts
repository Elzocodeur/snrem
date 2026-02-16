import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { OidcModule } from './oidc/oidc.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { JwtAuthGuard, RolesGuard, PermissionsGuard } from './common/guards';
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
      exclude: ['/api/(.*)', '/oidc/(.*)', '/.well-known/(.*)'],
    }),
    PrismaModule,
    AuthModule,
    OidcModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
  ],
  providers: [
    // Global guards — execution order: JWT → Roles → Permissions
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    // Global filters
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_FILTER, useClass: PrismaExceptionFilter },
    // Global interceptors
    { provide: APP_INTERCEPTOR, useClass: TransformResponseInterceptor },
    { provide: APP_INTERCEPTOR, useClass: AuditLogInterceptor },
  ],
})
export class AppModule {}
