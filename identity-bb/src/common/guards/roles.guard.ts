import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, IS_PUBLIC_KEY, DefaultRole } from '../constants';
import { JwtPayload } from '../interfaces';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload;
    if (!user) return false;

    // SUPER_ADMIN bypasses all role checks
    if (user.roles.includes(DefaultRole.SUPER_ADMIN)) return true;

    return requiredRoles.some((role) => user.roles.includes(role));
  }
}
