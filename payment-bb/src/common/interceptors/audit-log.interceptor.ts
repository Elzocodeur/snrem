import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user, ip, headers } = request;

    // Only log mutation operations (POST, PUT, PATCH, DELETE)
    const shouldLog = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

    if (!shouldLog) {
      return next.handle();
    }

    const action = this.getActionFromMethod(method);
    const resource = this.getResourceFromUrl(url);

    return next.handle().pipe(
      tap(async (data) => {
        try {
          await this.prisma.auditLog.create({
            data: {
              action,
              resource,
              resourceId: data?.id || data?.data?.id,
              userId: user?.id || user?.sub,
              newValue: JSON.stringify(data),
              ipAddress: ip || request.connection?.remoteAddress,
              userAgent: headers['user-agent'],
            },
          });
        } catch (error) {
          console.error('Failed to create audit log:', error);
        }
      }),
    );
  }

  private getActionFromMethod(method: string): string {
    const actions = {
      POST: 'CREATE',
      PUT: 'UPDATE',
      PATCH: 'UPDATE',
      DELETE: 'DELETE',
    };
    return actions[method] || 'UNKNOWN';
  }

  private getResourceFromUrl(url: string): string {
    const match = url.match(/\/api\/([^\/\?]+)/);
    return match ? match[1] : 'unknown';
  }
}
