import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ImBbService } from './im-bb.service';
import { ImBbInterceptor } from './im-bb.interceptor';

/**
 * Information Mediator Building Block (IM-BB) Module
 *
 * GovStack Compliance:
 * - Provides secure communication between Building Blocks
 * - Implements X-Road protocol for production deployments
 * - Handles service registry integration
 * - Manages message signing and encryption
 *
 * Usage:
 * - Development: Direct API calls between co-located BBs
 * - Production: Routes through IM-BB for cross-boundary communication
 */
@Module({
  imports: [HttpModule],
  providers: [ImBbService, ImBbInterceptor],
  exports: [ImBbService, ImBbInterceptor],
})
export class ImBbModule {}
