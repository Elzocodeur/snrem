import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CreatePermissionDto {
  @ApiProperty({ example: 'users' })
  @IsString()
  @IsNotEmpty()
  resource: string;

  @ApiProperty({ example: 'read' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z]+$/, { message: 'Action must be lowercase letters only' })
  action: string;

  @ApiPropertyOptional({ example: 'Allows reading user data' })
  @IsOptional()
  @IsString()
  description?: string;
}
