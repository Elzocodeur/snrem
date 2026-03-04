import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRefundDto } from './dto/create-refund.dto';

@Injectable()
export class RefundsService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateRefundDto) {
    // Verify transaction exists and is completed
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: createDto.transactionId },
      include: {
        refunds: true,
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.status !== 'COMPLETED') {
      throw new BadRequestException('Can only refund completed transactions');
    }

    // Calculate total refunded amount
    const totalRefunded = transaction.refunds.reduce(
      (sum, refund) => sum + refund.amount,
      0,
    );

    // Check if refund amount is valid
    if (totalRefunded + createDto.amount > transaction.amount) {
      throw new BadRequestException(
        'Refund amount exceeds transaction amount',
      );
    }

    // Create refund
    const refund = await this.prisma.refund.create({
      data: {
        transactionId: createDto.transactionId,
        amount: createDto.amount,
        reason: createDto.reason,
        status: 'PENDING',
      },
      include: {
        transaction: {
          include: {
            paymentProvider: true,
          },
        },
      },
    });

    // TODO: Process refund with payment provider
    // For now, we'll mark it as completed immediately
    // In production, this would call the provider's API

    return refund;
  }

  async findAll(transactionId?: string) {
    return this.prisma.refund.findMany({
      where: transactionId ? { transactionId } : undefined,
      include: {
        transaction: {
          include: {
            paymentProvider: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const refund = await this.prisma.refund.findUnique({
      where: { id },
      include: {
        transaction: {
          include: {
            paymentProvider: true,
          },
        },
      },
    });

    if (!refund) {
      throw new NotFoundException('Refund not found');
    }

    return refund;
  }

  async markAsCompleted(id: string, externalId?: string) {
    const refund = await this.prisma.refund.findUnique({
      where: { id },
      include: {
        transaction: true,
      },
    });

    if (!refund) {
      throw new NotFoundException('Refund not found');
    }

    // Update refund status
    const updatedRefund = await this.prisma.refund.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        processedAt: new Date(),
        ...(externalId && { externalId }),
      },
      include: {
        transaction: true,
      },
    });

    // Check if full refund and update transaction status
    const allRefunds = await this.prisma.refund.findMany({
      where: { transactionId: refund.transactionId },
    });

    const totalRefunded = allRefunds.reduce(
      (sum, r) => sum + r.amount,
      0,
    );

    if (totalRefunded >= refund.transaction.amount) {
      await this.prisma.transaction.update({
        where: { id: refund.transactionId },
        data: { status: 'REFUNDED' },
      });
    }

    return updatedRefund;
  }

  async markAsFailed(id: string, reason: string) {
    const refund = await this.prisma.refund.findUnique({
      where: { id },
    });

    if (!refund) {
      throw new NotFoundException('Refund not found');
    }

    return this.prisma.refund.update({
      where: { id },
      data: {
        status: 'FAILED',
      },
    });
  }
}
