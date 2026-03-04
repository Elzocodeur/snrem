import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentProviderDto } from './dto/create-payment-provider.dto';
import { UpdatePaymentProviderDto } from './dto/update-payment-provider.dto';

@Injectable()
export class PaymentProvidersService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreatePaymentProviderDto) {
    return this.prisma.paymentProvider.create({
      data: {
        ...createDto,
        config: createDto.config ? JSON.stringify(createDto.config) : undefined,
      },
    });
  }

  async findAll(activeOnly = false) {
    return this.prisma.paymentProvider.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { displayName: 'asc' },
    });
  }

  async findOne(id: string) {
    const provider = await this.prisma.paymentProvider.findUnique({
      where: { id },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });

    if (!provider) {
      throw new NotFoundException('Payment provider not found');
    }

    return provider;
  }

  async findByName(name: string) {
    const provider = await this.prisma.paymentProvider.findUnique({
      where: { name },
    });

    if (!provider) {
      throw new NotFoundException(`Payment provider '${name}' not found`);
    }

    return provider;
  }

  async update(id: string, updateDto: UpdatePaymentProviderDto) {
    const provider = await this.prisma.paymentProvider.findUnique({
      where: { id },
    });

    if (!provider) {
      throw new NotFoundException('Payment provider not found');
    }

    return this.prisma.paymentProvider.update({
      where: { id },
      data: {
        ...updateDto,
        config: updateDto.config ? JSON.stringify(updateDto.config) : undefined,
      },
    });
  }

  async activate(id: string) {
    return this.update(id, { isActive: true });
  }

  async deactivate(id: string) {
    return this.update(id, { isActive: false });
  }

  async remove(id: string) {
    const provider = await this.prisma.paymentProvider.findUnique({
      where: { id },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });

    if (!provider) {
      throw new NotFoundException('Payment provider not found');
    }

    // Don't allow deletion if there are associated transactions
    if (provider._count.transactions > 0) {
      throw new NotFoundException(
        'Cannot delete provider with existing transactions',
      );
    }

    return this.prisma.paymentProvider.delete({
      where: { id },
    });
  }
}
