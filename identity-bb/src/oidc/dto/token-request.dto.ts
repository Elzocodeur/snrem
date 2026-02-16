import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class TokenRequestDto {
  @ApiProperty({ example: 'authorization_code' })
  @IsString()
  @IsNotEmpty()
  grant_type: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  redirect_uri: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  client_id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  client_secret: string;
}
