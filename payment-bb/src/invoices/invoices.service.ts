import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateInvoiceDto, userId: string) {
    // Calculate totals
    const subtotal = createDto.items.reduce(
      (sum, item) => sum + item.amount,
      0,
    );
    const taxAmount = createDto.taxAmount || 0;
    const totalAmount = subtotal + taxAmount;

    // Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber();

    return this.prisma.invoice.create({
      data: {
        invoiceNumber,
        userId,
        status: createDto.status || 'DRAFT',
        subtotal,
        taxAmount,
        totalAmount,
        currency: createDto.currency || 'XOF',
        dueDate: createDto.dueDate,
        notes: createDto.notes,
        metadata: createDto.metadata
          ? JSON.stringify(createDto.metadata)
          : undefined,
        items: {
          create: createDto.items,
        },
      },
      include: {
        items: true,
      },
    });
  }

  async findAll(userId?: string) {
    return this.prisma.invoice.findMany({
      where: userId ? { userId } : undefined,
      include: {
        items: true,
        transactions: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId?: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        id,
        ...(userId && { userId }),
      },
      include: {
        items: true,
        transactions: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  async update(id: string, updateDto: UpdateInvoiceDto) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return this.prisma.invoice.update({
      where: { id },
      data: {
        ...updateDto,
        metadata: updateDto.metadata
          ? JSON.stringify(updateDto.metadata)
          : undefined,
      },
      include: {
        items: true,
        transactions: true,
      },
    });
  }

  async markAsPaid(id: string) {
    return this.update(id, {
      status: 'PAID',
      paidAt: new Date(),
    });
  }

  async cancel(id: string) {
    return this.update(id, {
      status: 'CANCELLED',
    });
  }

  private async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.invoice.count({
      where: {
        invoiceNumber: {
          startsWith: `INV-${year}-`,
        },
      },
    });

    const nextNumber = (count + 1).toString().padStart(4, '0');
    return `INV-${year}-${nextNumber}`;
  }
}
