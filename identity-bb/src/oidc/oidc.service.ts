import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOidcClientDto, UpdateOidcClientDto } from './dto';
import { OIDC_CODE_EXPIRY_MINUTES } from '../common/constants';

@Injectable()
export class OidcService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // ---------- JSON array helpers (SQLite stores arrays as JSON strings) ----------
  // When switching to PostgreSQL with native String[], remove these helpers and
  // use the array values directly.

  private parseJsonArray(value: string | string[]): string[] {
    if (Array.isArray(value)) return value;
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [value];
    }
  }

  private toJsonArray(value: string[]): string {
    return JSON.stringify(value);
  }

  // -------------------------------------------------------------------------------

  getDiscoveryDocument() {
    const issuer = this.configService.get<string>('OIDC_ISSUER', 'http://localhost:3000');
    return {
      issuer,
      authorization_endpoint: `${issuer}/oidc/authorize`,
      token_endpoint: `${issuer}/oidc/token`,
      userinfo_endpoint: `${issuer}/oidc/userinfo`,
      jwks_uri: `${issuer}/.well-known/jwks.json`,
      response_types_supported: ['code'],
      subject_types_supported: ['public'],
      id_token_signing_alg_values_supported: ['HS256'],
      scopes_supported: ['openid', 'profile', 'email'],
      token_endpoint_auth_methods_supported: ['client_secret_post'],
      claims_supported: ['sub', 'email', 'name', 'given_name', 'family_name'],
    };
  }

  getJwks() {
    // For simplicity, we use symmetric signing (HS256).
    // In production, generate RSA keys and expose public key here.
    return { keys: [] };
  }

  async authorize(
    clientId: string,
    redirectUri: string,
    scope: string,
    userId: string,
    nonce?: string,
  ) {
    const client = await this.prisma.oidcClient.findUnique({
      where: { clientId },
    });
    if (!client || !client.isActive) {
      throw new BadRequestException('Invalid client_id');
    }
    if (!this.parseJsonArray(client.redirectUris).includes(redirectUri)) {
      throw new BadRequestException('Invalid redirect_uri');
    }

    const code = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + OIDC_CODE_EXPIRY_MINUTES);

    await this.prisma.oidcAuthorizationCode.create({
      data: {
        code,
        clientId: client.id,
        userId,
        redirectUri,
        scope,
        nonce,
        expiresAt,
      },
    });

    return { code };
  }

  async exchangeToken(
    code: string,
    clientId: string,
    clientSecret: string,
    redirectUri: string,
  ) {
    const client = await this.prisma.oidcClient.findUnique({
      where: { clientId },
    });
    if (!client || client.clientSecret !== clientSecret) {
      throw new UnauthorizedException('Invalid client credentials');
    }

    const authCode = await this.prisma.oidcAuthorizationCode.findUnique({
      where: { code },
      include: {
        user: {
          include: {
            userRoles: {
              include: { role: { include: { rolePermissions: { include: { permission: true } } } } },
            },
          },
        },
      },
    });

    if (!authCode) {
      throw new BadRequestException('Invalid authorization code');
    }
    if (authCode.used) {
      throw new BadRequestException('Authorization code already used');
    }
    if (new Date() > authCode.expiresAt) {
      throw new BadRequestException('Authorization code expired');
    }
    if (authCode.clientId !== client.id) {
      throw new BadRequestException('Client mismatch');
    }
    if (authCode.redirectUri !== redirectUri) {
      throw new BadRequestException('Redirect URI mismatch');
    }

    // Mark code as used
    await this.prisma.oidcAuthorizationCode.update({
      where: { id: authCode.id },
      data: { used: true },
    });

    const user = authCode.user;
    const roles = user.userRoles.map((ur: any) => ur.role.name);
    const permissions = user.userRoles.flatMap((ur: any) =>
      ur.role.rolePermissions.map(
        (rp: any) => `${rp.permission.resource}:${rp.permission.action}`,
      ),
    );

    const accessToken = this.jwtService.sign(
      { sub: user.id, email: user.email, roles, permissions: [...new Set(permissions)] },
      { expiresIn: '15m' },
    );

    const idToken = this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        name: [user.firstName, user.lastName].filter(Boolean).join(' ') || undefined,
        given_name: user.firstName,
        family_name: user.lastName,
        nonce: authCode.nonce,
        iss: this.configService.get<string>('OIDC_ISSUER', 'http://localhost:3000'),
        aud: clientId,
      },
      { expiresIn: '1h' },
    );

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 900,
      id_token: idToken,
      scope: authCode.scope,
    };
  }

  async getUserInfo(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('User not found');

    return {
      sub: user.id,
      email: user.email,
      name: [user.firstName, user.lastName].filter(Boolean).join(' ') || undefined,
      given_name: user.firstName,
      family_name: user.lastName,
    };
  }

  async createClient(dto: CreateOidcClientDto) {
    const clientId = uuidv4();
    const clientSecret = crypto.randomBytes(32).toString('hex');

    return this.prisma.oidcClient.create({
      data: {
        clientId,
        clientSecret,
        clientName: dto.clientName,
        redirectUris: this.toJsonArray(dto.redirectUris),
        scopes: this.toJsonArray(dto.scopes ?? ['openid', 'profile', 'email']),
        grantTypes: this.toJsonArray(dto.grantTypes ?? ['authorization_code']),
      },
    });
  }

  async updateClient(id: string, dto: UpdateOidcClientDto) {
    const client = await this.prisma.oidcClient.findUnique({ where: { id } });
    if (!client) throw new NotFoundException('OIDC client not found');

    return this.prisma.oidcClient.update({
      where: { id },
      data: {
        ...(dto.clientName !== undefined && { clientName: dto.clientName }),
        ...(dto.redirectUris !== undefined && { redirectUris: this.toJsonArray(dto.redirectUris) }),
        ...(dto.scopes !== undefined && { scopes: this.toJsonArray(dto.scopes) }),
        ...(dto.grantTypes !== undefined && { grantTypes: this.toJsonArray(dto.grantTypes) }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }
}
