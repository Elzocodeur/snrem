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
import { RefundsService } from './refunds.service';
import { CreateRefundDto } from './dto/create-refund.dto';

@ApiTags('refunds')
@ApiBearerAuth()
@Controller('refunds')
export class RefundsController {
  constructor(private readonly refundsService: RefundsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a refund' })
  create(@Body() createDto: CreateRefundDto) {
    return this.refundsService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all refunds' })
  findAll(@Query('transactionId') transactionId?: string) {
    return this.refundsService.findAll(transactionId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a refund by ID' })
  findOne(@Param('id') id: string) {
    return this.refundsService.findOne(id);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Mark refund as completed' })
  markAsCompleted(
    @Param('id') id: string,
    @Body('externalId') externalId?: string,
  ) {
    return this.refundsService.markAsCompleted(id, externalId);
  }

  @Patch(':id/fail')
  @ApiOperation({ summary: 'Mark refund as failed' })
  markAsFailed(@Param('id') id: string, @Body('reason') reason: string) {
    return this.refundsService.markAsFailed(id, reason);
  }
}
