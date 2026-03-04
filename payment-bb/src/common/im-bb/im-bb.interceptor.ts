import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * Information Mediator Interceptor
 *
 * Captures and logs IM-BB related headers for audit trail
 * GovStack compliance: All cross-BB communication must be traceable
 */
@Injectable()
export class ImBbInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ImBbInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Extract IM-BB headers if present
    const imBbHeaders = {
      xRoadClient: request.headers['x-road-client'],
      xRoadService: request.headers['x-road-service'],
      xRoadId: request.headers['x-road-id'],
      xRoadUserId: request.headers['x-road-userid'],
    };

    // If this request came through IM-BB, log it
    if (imBbHeaders.xRoadId) {
      this.logger.log(
        `IM-BB Request: ${imBbHeaders.xRoadClient} -> ${imBbHeaders.xRoadService} [${imBbHeaders.xRoadId}]`,
      );

      // Attach IM-BB context to request for downstream use
      request.imBbContext = imBbHeaders;

      // Add IM-BB transaction ID to response headers
      response.setHeader('X-Road-Id', imBbHeaders.xRoadId);
    }

    return next.handle().pipe(
      tap(() => {
        if (imBbHeaders.xRoadId) {
          this.logger.log(
            `IM-BB Response: [${imBbHeaders.xRoadId}] completed`,
          );
        }
      }),
    );
  }
}
