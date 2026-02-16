import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ example: 'MANAGER' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Regional manager role' })
  @IsOptional()
  @IsString()
  description?: string;
}
