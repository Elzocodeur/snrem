import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString } from 'class-validator';

export class UpdateTransactionDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  externalId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  failureReason?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  completedAt?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  metadata?: any;
}
