import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

/**
 * Information Mediator Building Block Service
 *
 * Flexible inter-BB communication supporting multiple modes:
 *
 * MODE 1: Direct HTTP (Development)
 * - Fast local development
 * - No IM-BB infrastructure needed
 * - Simple debugging
 *
 * MODE 2: IM-BB with X-Road (Production)
 * - GovStack compliant
 * - Encrypted & signed messages
 * - Full audit trail
 * - Service discovery
 *
 * Configuration via environment variables:
 * - USE_IM_BB=false → Direct HTTP mode
 * - USE_IM_BB=true → IM-BB mode
 *
 * GovStack Standards:
 * - X-Road protocol for secure messaging
 * - Service discovery via IM-BB registry
 * - Message signing and encryption
 * - Audit trail with transaction IDs
 */
@Injectable()
export class ImBbService {
  private readonly logger = new Logger(ImBbService.name);
  private readonly useImBb: boolean;
  private readonly imBbUrl: string;
  private readonly clientIdentifier: string;
  private readonly instanceIdentifier: string;
  private readonly mode: 'direct' | 'im-bb';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.useImBb = this.configService.get('USE_IM_BB', 'false') === 'true';
    this.imBbUrl = this.configService.get('IM_BB_URL', '');
    this.clientIdentifier = this.configService.get(
      'IM_BB_CLIENT_ID',
      'PAYMENT-BB',
    );
    this.instanceIdentifier = this.configService.get(
      'IM_BB_INSTANCE',
      'SN/GOV/SENRM/PAYMENT-BB',
    );
    this.mode = this.useImBb ? 'im-bb' : 'direct';

    // Log configuration mode on startup
    this.logger.log(`
╔════════════════════════════════════════════════════╗
║  Information Mediator Configuration               ║
╠════════════════════════════════════════════════════╣
║  Mode: ${this.mode.toUpperCase().padEnd(42)} ║
║  Client: ${this.clientIdentifier.padEnd(40)} ║
${this.useImBb ? `║  IM-BB URL: ${this.imBbUrl.padEnd(37)} ║` : '║  Direct HTTP Communication (Development)       ║'}
╚════════════════════════════════════════════════════╝
    `);
  }

  /**
   * Call another Building Block service
   */
  async callBuildingBlock<T = any>(
    targetBB: string,
    servicePath: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
      data?: any;
      headers?: Record<string, string>;
      params?: Record<string, any>;
    } = {},
  ): Promise<T> {
    const { method = 'GET', data, headers = {}, params } = options;

    if (this.useImBb) {
      return this.callViaImBb<T>(targetBB, servicePath, {
        method,
        data,
        headers,
        params,
      });
    } else {
      return this.callDirectly<T>(targetBB, servicePath, {
        method,
        data,
        headers,
        params,
      });
    }
  }

  /**
   * Call via Information Mediator (Production)
   *
   * Routes request through IM-BB with X-Road headers
   * Uses full X-Road instance identifiers for GovStack compliance
   */
  private async callViaImBb<T>(
    targetBB: string,
    servicePath: string,
    options: any,
  ): Promise<T> {
    const targetInstance = this.configService.get(
      `${targetBB}_INSTANCE`,
      `SN/GOV/SENRM/${targetBB}`,
    );

    const xRoadHeaders = {
      'X-Road-Client': this.instanceIdentifier,
      'X-Road-Service': `${targetInstance}${servicePath}`,
      'X-Road-UserId': options.headers?.userId || 'system',
      'X-Road-Id': this.generateTransactionId(),
      'X-Road-Request-Hash': this.generateRequestHash(options.data),
    };

    const url = `${this.imBbUrl}/r1/${targetInstance}${servicePath}`;

    this.logger.log(
      `📡 IM-BB Call: ${this.instanceIdentifier} → ${targetInstance}${servicePath}`,
    );

    try {
      const response = await firstValueFrom(
        this.httpService.request({
          method: options.method,
          url,
          data: options.data,
          params: options.params,
          headers: {
            ...options.headers,
            ...xRoadHeaders,
          },
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        `IM-BB call failed: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Call directly (Development - Co-located BBs)
   *
   * Makes direct HTTP call to Building Block without IM-BB
   */
  private async callDirectly<T>(
    targetBB: string,
    servicePath: string,
    options: any,
  ): Promise<T> {
    const baseUrl = this.configService.get(`${targetBB}_URL`);

    if (!baseUrl) {
      throw new Error(
        `No direct URL configured for ${targetBB}. Set ${targetBB}_URL in .env`,
      );
    }

    const url = `${baseUrl}${servicePath}`;

    this.logger.log(
      `Calling ${targetBB} directly: ${options.method} ${url}`,
    );

    try {
      const response = await firstValueFrom(
        this.httpService.request({
          method: options.method,
          url,
          data: options.data,
          params: options.params,
          headers: options.headers,
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        `Direct BB call failed: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Verify user with Identity BB
   */
  async verifyUserWithIdentityBB(token: string): Promise<any> {
    return this.callBuildingBlock('IDENTITY-BB', '/api/users/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  /**
   * Generate unique transaction ID for X-Road
   */
  private generateTransactionId(): string {
    return `${this.clientIdentifier}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Generate request hash for audit (simple implementation)
   */
  private generateRequestHash(data: any): string {
    const content = JSON.stringify(data || {});
    // Simple hash for demo - use proper cryptographic hash in production
    return Buffer.from(content).toString('base64').substring(0, 32);
  }

  /**
   * Check if IM-BB is enabled
   */
  isImBbEnabled(): boolean {
    return this.useImBb;
  }

  /**
   * Get current communication mode
   */
  getMode(): 'direct' | 'im-bb' {
    return this.mode;
  }

  /**
   * Get IM-BB configuration info
   */
  getConfig() {
    return {
      mode: this.mode,
      useImBb: this.useImBb,
      imBbUrl: this.imBbUrl,
      clientId: this.clientIdentifier,
      instance: this.instanceIdentifier,
    };
  }
}
