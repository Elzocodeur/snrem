import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional, IsUUID, Min } from 'class-validator';

export class CreateRefundDto {
  @ApiProperty({ description: 'Transaction ID to refund' })
  @IsUUID()
  transactionId: string;

  @ApiProperty({ example: 50000, description: 'Refund amount' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ required: false, description: 'Refund reason' })
  @IsString()
  @IsOptional()
  reason?: string;
}
