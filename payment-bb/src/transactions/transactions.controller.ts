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
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { CurrentUser } from '../common/decorators';

@ApiTags('transactions')
@ApiBearerAuth()
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new transaction' })
  create(
    @Body() createDto: CreateTransactionDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.transactionsService.create(createDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all transactions' })
  findAll(@CurrentUser('id') userId: string, @Query('all') all?: string) {
    // If user has admin role, they can see all transactions
    return this.transactionsService.findAll(all === 'true' ? undefined : userId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get transaction statistics' })
  getStats(@CurrentUser('id') userId: string, @Query('all') all?: string) {
    return this.transactionsService.getStats(
      all === 'true' ? undefined : userId,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a transaction by ID' })
  findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.transactionsService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a transaction' })
  update(@Param('id') id: string, @Body() updateDto: UpdateTransactionDto) {
    return this.transactionsService.update(id, updateDto);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Mark transaction as completed' })
  markAsCompleted(
    @Param('id') id: string,
    @Body('externalId') externalId?: string,
  ) {
    return this.transactionsService.markAsCompleted(id, externalId);
  }

  @Patch(':id/fail')
  @ApiOperation({ summary: 'Mark transaction as failed' })
  markAsFailed(@Param('id') id: string, @Body('reason') reason: string) {
    return this.transactionsService.markAsFailed(id, reason);
  }
}
