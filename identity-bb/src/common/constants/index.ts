export const IS_PUBLIC_KEY = 'isPublic';
export const ROLES_KEY = 'roles';
export const PERMISSIONS_KEY = 'permissions';

export enum DefaultRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  AGENT = 'AGENT',
  CITIZEN = 'CITIZEN',
}

export const JWT_ACCESS_EXPIRY = '15m';
export const JWT_REFRESH_EXPIRY_DAYS = 7;
export const BCRYPT_ROUNDS = 12;
export const OIDC_CODE_EXPIRY_MINUTES = 10;
