import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { CurrentUser } from '../common/decorators';

@ApiTags('invoices')
@ApiBearerAuth()
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new invoice' })
  create(
    @Body() createDto: CreateInvoiceDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.invoicesService.create(createDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all invoices' })
  findAll(@CurrentUser('id') userId: string, @Query('all') all?: string) {
    return this.invoicesService.findAll(all === 'true' ? undefined : userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an invoice by ID' })
  findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.invoicesService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an invoice' })
  update(@Param('id') id: string, @Body() updateDto: UpdateInvoiceDto) {
    return this.invoicesService.update(id, updateDto);
  }

  @Patch(':id/pay')
  @ApiOperation({ summary: 'Mark invoice as paid' })
  markAsPaid(@Param('id') id: string) {
    return this.invoicesService.markAsPaid(id);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel an invoice' })
  cancel(@Param('id') id: string) {
    return this.invoicesService.cancel(id);
  }
}
