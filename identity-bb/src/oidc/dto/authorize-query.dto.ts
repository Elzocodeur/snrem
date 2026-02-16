import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AuthorizeQueryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  response_type: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  client_id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  redirect_uri: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  scope: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nonce?: string;
}
