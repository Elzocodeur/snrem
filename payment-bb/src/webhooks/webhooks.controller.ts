import {
  Controller,
  Post,
  Body,
  Headers,
  Get,
  Query,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';
import { Public } from '../common/decorators';
import { Request } from 'express';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('stripe')
  @Public()
  @ApiOperation({ summary: 'Stripe webhook endpoint' })
  async handleStripeWebhook(
    @Body() body: any,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.webhooksService.handleStripeWebhook(body, signature);
  }

  @Post('wave')
  @Public()
  @ApiOperation({ summary: 'Wave webhook endpoint' })
  async handleWaveWebhook(@Body() body: any) {
    return this.webhooksService.handleWaveWebhook(body);
  }

  @Post('orange-money')
  @Public()
  @ApiOperation({ summary: 'Orange Money webhook endpoint' })
  async handleOrangeMoneyWebhook(@Body() body: any) {
    return this.webhooksService.handleOrangeMoneyWebhook(body);
  }

  @Get('events')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get webhook events (Admin only)' })
  getWebhookEvents(
    @Query('provider') provider?: string,
    @Query('processed') processed?: string,
  ) {
    return this.webhooksService.getWebhookEvents(
      provider,
      processed ? processed === 'true' : undefined,
    );
  }
}
