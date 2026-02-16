import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

// SQLite does not support enums, so status is validated as a string.
// For PostgreSQL: import { UserStatus } from '@prisma/client' and use @IsEnum(UserStatus).
const USER_STATUSES = ['ACTIVE', 'INACTIVE', 'SUSPENDED'] as const;

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Amadou' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Diallo' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ example: '+221770000000' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'NID-123456789' })
  @IsOptional()
  @IsString()
  nationalId?: string;

  @ApiPropertyOptional({ enum: USER_STATUSES })
  @IsOptional()
  @IsIn(USER_STATUSES)
  status?: string;
}
