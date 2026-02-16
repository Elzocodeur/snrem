import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import {
  BCRYPT_ROUNDS,
  DefaultRole,
  JWT_ACCESS_EXPIRY,
  JWT_REFRESH_EXPIRY_DAYS,
} from '../common/constants';
import { JwtPayload } from '../common/interfaces';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    // Find the CITIZEN role
    const citizenRole = await this.prisma.role.findUnique({
      where: { name: DefaultRole.CITIZEN },
    });

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        nationalId: dto.nationalId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        ...(citizenRole
          ? { userRoles: { create: { roleId: citizenRole.id } } }
          : {}),
      },
      include: {
        userRoles: { include: { role: { include: { rolePermissions: { include: { permission: true } } } } } },
      },
    });

    const tokens = await this.generateTokens(user);
    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        userRoles: { include: { role: { include: { rolePermissions: { include: { permission: true } } } } } },
      },
    });

    if (!user) return null;
    if (user.status !== 'ACTIVE') return null;

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) return null;

    return user;
  }

  async login(user: any) {
    const tokens = await this.generateTokens(user);
    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async refreshToken(refreshTokenValue: string) {
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshTokenValue },
      include: {
        user: {
          include: {
            userRoles: { include: { role: { include: { rolePermissions: { include: { permission: true } } } } } },
          },
        },
      },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Replay detection: if token is revoked, revoke entire family
    if (storedToken.revoked) {
      await this.prisma.refreshToken.updateMany({
        where: { family: storedToken.family },
        data: { revoked: true },
      });
      throw new ForbiddenException(
        'Refresh token reuse detected. All sessions in this family have been revoked.',
      );
    }

    if (new Date() > storedToken.expiresAt) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    // Revoke the used token
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked: true },
    });

    // Generate new tokens with the same family
    const tokens = await this.generateTokens(
      storedToken.user,
      storedToken.family,
    );

    return {
      user: this.sanitizeUser(storedToken.user),
      ...tokens,
    };
  }

  async logout(refreshTokenValue: string) {
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshTokenValue },
    });

    if (storedToken) {
      // Revoke entire family on logout
      await this.prisma.refreshToken.updateMany({
        where: { family: storedToken.family },
        data: { revoked: true },
      });
    }

    return { message: 'Logged out successfully' };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: { include: { role: true } },
      },
    });
    if (!user) throw new UnauthorizedException('User not found');
    return this.sanitizeUser(user);
  }

  private async generateTokens(user: any, family?: string) {
    const roles = (user.userRoles ?? []).map((ur: any) => ur.role.name);
    const permissions = (user.userRoles ?? []).flatMap((ur: any) =>
      (ur.role.rolePermissions ?? []).map(
        (rp: any) => `${rp.permission.resource}:${rp.permission.action}`,
      ),
    );

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles,
      permissions: [...new Set<string>(permissions)],
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: JWT_ACCESS_EXPIRY,
    });

    // Create refresh token
    const tokenFamily = family ?? uuidv4();
    const refreshTokenValue = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + JWT_REFRESH_EXPIRY_DAYS);

    await this.prisma.refreshToken.create({
      data: {
        token: refreshTokenValue,
        family: tokenFamily,
        userId: user.id,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: refreshTokenValue,
      expiresIn: JWT_ACCESS_EXPIRY,
    };
  }

  private sanitizeUser(user: any) {
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }
}
