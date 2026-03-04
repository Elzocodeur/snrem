import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreatePaymentProviderDto {
  @ApiProperty({ example: 'stripe' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Stripe' })
  @IsString()
  displayName: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ default: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ required: false, description: 'Provider configuration as JSON' })
  @IsOptional()
  config?: any;
}
