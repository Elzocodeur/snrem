import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateOidcClientDto {
  @ApiProperty({ example: 'My Application' })
  @IsString()
  @IsNotEmpty()
  clientName: string;

  @ApiProperty({ example: ['https://app.example.com/callback'] })
  @IsArray()
  @IsString({ each: true })
  redirectUris: string[];

  @ApiPropertyOptional({ example: ['openid', 'profile', 'email'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scopes?: string[];

  @ApiPropertyOptional({ example: ['authorization_code'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  grantTypes?: string[];
}

export class UpdateOidcClientDto {
  @ApiPropertyOptional({ example: 'Updated App Name' })
  @IsOptional()
  @IsString()
  clientName?: string;

  @ApiPropertyOptional({ example: ['https://app.example.com/callback'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  redirectUris?: string[];

  @ApiPropertyOptional({ example: ['openid', 'profile', 'email'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scopes?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  grantTypes?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  isActive?: boolean;
}
