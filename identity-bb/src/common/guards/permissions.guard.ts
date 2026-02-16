import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY, IS_PUBLIC_KEY, DefaultRole } from '../constants';
import { JwtPayload } from '../interfaces';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredPermissions || requiredPermissions.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload;
    if (!user) return false;

    // SUPER_ADMIN bypasses all permission checks
    if (user.roles.includes(DefaultRole.SUPER_ADMIN)) return true;

    return requiredPermissions.every((perm) =>
      user.permissions.includes(perm),
    );
  }
}
