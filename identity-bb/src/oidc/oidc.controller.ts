import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OidcService } from './oidc.service';
import { AuthorizeQueryDto, TokenRequestDto, CreateOidcClientDto, UpdateOidcClientDto } from './dto';
import { Public, Roles, CurrentUser } from '../common/decorators';
import { DefaultRole } from '../common/constants';
import type { JwtPayload } from '../common/interfaces';

@ApiTags('OIDC')
@Controller()
export class OidcController {
  constructor(private oidcService: OidcService) {}

  @Public()
  @Get('.well-known/openid-configuration')
  @ApiOperation({ summary: 'OIDC Discovery Document' })
  getDiscovery() {
    return this.oidcService.getDiscoveryDocument();
  }

  @Public()
  @Get('.well-known/jwks.json')
  @ApiOperation({ summary: 'JSON Web Key Set' })
  getJwks() {
    return this.oidcService.getJwks();
  }

  @Get('oidc/authorize')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'OIDC Authorization Endpoint (requires authenticated user)' })
  async authorize(
    @Query() query: AuthorizeQueryDto,
    @CurrentUser() user: { sub: string },
  ) {
    if (query.response_type !== 'code') {
      throw new BadRequestException('Only response_type=code is supported');
    }
    const result = await this.oidcService.authorize(
      query.client_id,
      query.redirect_uri,
      query.scope,
      user.sub,
      query.nonce,
    );

    const redirectUrl = new URL(query.redirect_uri);
    redirectUrl.searchParams.set('code', result.code);
    if (query.state) {
      redirectUrl.searchParams.set('state', query.state);
    }
    return { redirect_uri: redirectUrl.toString() };
  }

  @Public()
  @Post('oidc/token')
  @ApiOperation({ summary: 'OIDC Token Endpoint' })
  async token(@Body() dto: TokenRequestDto) {
    if (dto.grant_type !== 'authorization_code') {
      throw new BadRequestException('Only grant_type=authorization_code is supported');
    }
    if (!dto.code) {
      throw new BadRequestException('Authorization code is required');
    }
    return this.oidcService.exchangeToken(
      dto.code,
      dto.client_id,
      dto.client_secret,
      dto.redirect_uri,
    );
  }

  @Get('oidc/userinfo')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'OIDC UserInfo Endpoint' })
  async userinfo(@CurrentUser('sub') userId: string) {
    return this.oidcService.getUserInfo(userId);
  }

  @Post('oidc/client-mgmt/oidc-client')
  @Roles(DefaultRole.ADMIN, DefaultRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register a new OIDC client' })
  async createClient(@Body() dto: CreateOidcClientDto) {
    return this.oidcService.createClient(dto);
  }

  @Put('oidc/client-mgmt/oidc-client/:id')
  @Roles(DefaultRole.ADMIN, DefaultRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an OIDC client' })
  async updateClient(@Param('id') id: string, @Body() dto: UpdateOidcClientDto) {
    return this.oidcService.updateClient(id, dto);
  }
}
