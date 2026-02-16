import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../interfaces';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;

    // Only audit mutating operations
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return next.handle();
    }

    const user = request.user as JwtPayload | undefined;
    const path: string = request.route?.path ?? request.url;
    const action = this.methodToAction(method);
    const resource = this.extractResource(path);

    return next.handle().pipe(
      tap((responseData) => {
        this.prisma.auditLog
          .create({
            data: {
              action,
              resource,
              resourceId: request.params?.id ?? null,
              userId: user?.sub ?? null,
              newValue: request.body ? JSON.stringify(request.body) : null,
              ipAddress:
                (request.headers['x-forwarded-for'] as string) ??
                request.ip ??
                null,
              userAgent: request.headers['user-agent'] ?? null,
            },
          })
          .catch(() => {
            // Audit logging should never break the request
          });
      }),
    );
  }

  private methodToAction(method: string): string {
    const map: Record<string, string> = {
      POST: 'create',
      PUT: 'update',
      PATCH: 'update',
      DELETE: 'delete',
    };
    return map[method] ?? method.toLowerCase();
  }

  private extractResource(path: string): string {
    // Extract resource name from path like /api/v1/users/:id -> users
    const segments = path.split('/').filter(Boolean);
    // Skip 'api', 'v1', find the first meaningful segment
    for (const segment of segments) {
      if (segment !== 'api' && segment !== 'v1' && !segment.startsWith(':')) {
        return segment;
      }
    }
    return 'unknown';
  }
}
