import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ImBbService } from '../im-bb';

/**
 * JWT Strategy for validating tokens from Identity BB
 *
 * GovStack Compliance:
 * - OAuth2/OpenID Connect standard
 * - Validates JWT tokens issued by Identity BB (OIDC Provider)
 * - Supports Partner Specific User Token (PSUT)
 * - Can verify token with Identity BB via IM-BB
 *
 * Token Payload Structure (from Identity BB):
 * {
 *   sub: "user-id",
 *   username: "john.doe",
 *   email: "john@example.com",
 *   roles: ["citizen", "driver"],
 *   permissions: ["payment:create", "invoice:read"],
 *   psut: "partner-specific-user-token",
 *   iss: "http://localhost:3000",
 *   aud: "payment-bb",
 *   exp: 1234567890
 * }
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly imBbService: ImBbService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
      issuer: configService.get<string>('IDENTITY_BB_URL'),
      audience: 'payment-bb',
    });
  }

  /**
   * Validate JWT payload
   *
   * This method is called after the token signature is verified.
   * For enhanced security in production, you can verify with Identity BB.
   */
  async validate(payload: any) {
    // Basic validation
    if (!payload.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // Optional: Verify with Identity BB for additional security
    // Uncomment in production with IM-BB enabled
    /*
    if (this.imBbService.isImBbEnabled()) {
      try {
        const userFromIdentityBB = await this.imBbService.verifyUserWithIdentityBB(
          // Note: token is not available here, would need to extract from request
        );
        // Additional validation against Identity BB
      } catch (error) {
        throw new UnauthorizedException('Token verification with Identity BB failed');
      }
    }
    */

    // Return user object that will be attached to request.user
    return {
      id: payload.sub,
      userId: payload.sub,
      username: payload.username,
      email: payload.email,
      roles: payload.roles || [],
      permissions: payload.permissions || [],
      psut: payload.psut, // Partner Specific User Token
      nationalId: payload.nationalId,
      firstName: payload.firstName,
      lastName: payload.lastName,
    };
  }
}
