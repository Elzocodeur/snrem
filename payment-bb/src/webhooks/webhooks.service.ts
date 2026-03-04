import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WebhooksService {
  constructor(private prisma: PrismaService) {}

  async handleStripeWebhook(payload: any, signature: string) {
    // Verify webhook signature
    // TODO: Implement Stripe signature verification

    // Log the webhook event
    const event = await this.prisma.webhookEvent.create({
      data: {
        provider: 'stripe',
        eventType: payload.type,
        payload: JSON.stringify(payload),
        processed: false,
      },
    });

    // Process the webhook based on event type
    try {
      await this.processWebhookEvent(event.id, payload);
      return { received: true };
    } catch (error) {
      console.error('Webhook processing error:', error);
      await this.prisma.webhookEvent.update({
        where: { id: event.id },
        data: {
          error: error.message,
        },
      });
      throw error;
    }
  }

  async handleWaveWebhook(payload: any) {
    // Log the webhook event
    const event = await this.prisma.webhookEvent.create({
      data: {
        provider: 'wave',
        eventType: payload.event_type || 'payment',
        payload: JSON.stringify(payload),
        processed: false,
      },
    });

    try {
      await this.processWebhookEvent(event.id, payload);
      return { received: true };
    } catch (error) {
      console.error('Webhook processing error:', error);
      await this.prisma.webhookEvent.update({
        where: { id: event.id },
        data: {
          error: error.message,
        },
      });
      throw error;
    }
  }

  async handleOrangeMoneyWebhook(payload: any) {
    const event = await this.prisma.webhookEvent.create({
      data: {
        provider: 'orange_money',
        eventType: payload.event_type || 'payment',
        payload: JSON.stringify(payload),
        processed: false,
      },
    });

    try {
      await this.processWebhookEvent(event.id, payload);
      return { received: true };
    } catch (error) {
      console.error('Webhook processing error:', error);
      await this.prisma.webhookEvent.update({
        where: { id: event.id },
        data: {
          error: error.message,
        },
      });
      throw error;
    }
  }

  private async processWebhookEvent(eventId: string, payload: any) {
    // Process different event types
    // This is where you'd update transaction status, send notifications, etc.

    // Example: Update transaction status based on webhook
    if (payload.type === 'payment_intent.succeeded' || payload.status === 'completed') {
      const externalId = payload.id || payload.transaction_id;

      if (externalId) {
        const transaction = await this.prisma.transaction.findFirst({
          where: { externalId },
        });

        if (transaction) {
          await this.prisma.transaction.update({
            where: { id: transaction.id },
            data: {
              status: 'COMPLETED',
              completedAt: new Date(),
            },
          });
        }
      }
    }

    // Mark webhook as processed
    await this.prisma.webhookEvent.update({
      where: { id: eventId },
      data: {
        processed: true,
        processedAt: new Date(),
      },
    });
  }

  async getWebhookEvents(provider?: string, processed?: boolean) {
    return this.prisma.webhookEvent.findMany({
      where: {
        ...(provider && { provider }),
        ...(processed !== undefined && { processed }),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
