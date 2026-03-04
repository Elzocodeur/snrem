import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional, IsUUID, Min } from 'class-validator';

export class CreateTransactionDto {
  @ApiProperty({ example: 50000, description: 'Transaction amount' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ example: 'XOF', default: 'XOF' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({ description: 'Payment provider ID' })
  @IsUUID()
  paymentProviderId: string;

  @ApiProperty({ required: false, description: 'Invoice ID if paying an invoice' })
  @IsUUID()
  @IsOptional()
  invoiceId?: string;

  @ApiProperty({ required: false, description: 'Transaction description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false, description: 'Additional metadata as JSON' })
  @IsOptional()
  metadata?: any;
}
