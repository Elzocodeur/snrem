import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateTransactionDto, userId: string) {
    // Verify invoice exists if provided
    if (createDto.invoiceId) {
      const invoice = await this.prisma.invoice.findUnique({
        where: { id: createDto.invoiceId },
      });
      if (!invoice) {
        throw new NotFoundException('Invoice not found');
      }
    }

    // Verify payment provider exists and is active
    const provider = await this.prisma.paymentProvider.findUnique({
      where: { id: createDto.paymentProviderId },
    });
    if (!provider) {
      throw new NotFoundException('Payment provider not found');
    }
    if (!provider.isActive) {
      throw new BadRequestException('Payment provider is not active');
    }

    return this.prisma.transaction.create({
      data: {
        ...createDto,
        userId,
        status: 'PENDING',
      },
      include: {
        paymentProvider: true,
        invoice: true,
      },
    });
  }

  async findAll(userId?: string) {
    return this.prisma.transaction.findMany({
      where: userId ? { userId } : undefined,
      include: {
        paymentProvider: true,
        invoice: true,
        refunds: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId?: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: {
        id,
        ...(userId && { userId }),
      },
      include: {
        paymentProvider: true,
        invoice: true,
        refunds: true,
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }

  async update(id: string, updateDto: UpdateTransactionDto) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return this.prisma.transaction.update({
      where: { id },
      data: updateDto,
      include: {
        paymentProvider: true,
        invoice: true,
        refunds: true,
      },
    });
  }

  async markAsCompleted(id: string, externalId?: string) {
    return this.update(id, {
      status: 'COMPLETED',
      completedAt: new Date(),
      ...(externalId && { externalId }),
    });
  }

  async markAsFailed(id: string, reason: string) {
    return this.update(id, {
      status: 'FAILED',
      failureReason: reason,
    });
  }

  async getStats(userId?: string) {
    const where = userId ? { userId } : {};

    const [total, pending, completed, failed, totalAmount] =
      await Promise.all([
        this.prisma.transaction.count({ where }),
        this.prisma.transaction.count({ where: { ...where, status: 'PENDING' } }),
        this.prisma.transaction.count({
          where: { ...where, status: 'COMPLETED' },
        }),
        this.prisma.transaction.count({ where: { ...where, status: 'FAILED' } }),
        this.prisma.transaction.aggregate({
          where: { ...where, status: 'COMPLETED' },
          _sum: { amount: true },
        }),
      ]);

    return {
      total,
      pending,
      completed,
      failed,
      totalAmount: totalAmount._sum.amount || 0,
    };
  }
}
