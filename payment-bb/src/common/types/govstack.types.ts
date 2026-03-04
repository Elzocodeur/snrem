/**
 * GovStack Building Block Integration Types
 *
 * Standard types for inter-BB communication following GovStack specifications
 */

/**
 * User information from Identity BB
 * Compliant with GovStack Identity BB specification
 */
export interface IdentityBBUser {
  id: string;
  username: string;
  email: string;
  nationalId?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  roles: string[];
  permissions: string[];
  psut?: string; // Partner Specific User Token
}

/**
 * Information Mediator context
 * X-Road headers for cross-BB communication
 */
export interface ImBbContext {
  xRoadClient?: string; // Calling Building Block identifier
  xRoadService?: string; // Target service path
  xRoadId?: string; // Unique transaction ID
  xRoadUserId?: string; // User identifier in the calling BB
}

/**
 * Standard API Response wrapper
 * GovStack best practice for consistent responses
 */
export interface GovStackApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    timestamp: string;
    requestId?: string;
    imBbTransactionId?: string;
  };
}

/**
 * Audit Log entry for cross-BB operations
 */
export interface CrossBBAuditLog {
  action: string;
  resource: string;
  resourceId?: string;
  userId?: string;
  sourceBuildingBlock?: string; // Which BB initiated the request
  destinationBuildingBlock: string; // This BB (PAYMENT-BB)
  imBbTransactionId?: string; // X-Road transaction ID
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

/**
 * Service Registry entry
 * For registering services with IM-BB
 */
export interface ServiceRegistryEntry {
  serviceName: string;
  serviceVersion: string;
  buildingBlock: string;
  baseUrl: string;
  authentication: 'OAuth2' | 'JWT' | 'None';
  requiredScopes?: string[];
  endpoints: ServiceEndpoint[];
}

export interface ServiceEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  description: string;
  requiredPermissions?: string[];
}

/**
 * OAuth2 Token Response from Identity BB
 */
export interface OAuth2TokenResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  id_token?: string; // OpenID Connect ID token
}

/**
 * OIDC UserInfo response from Identity BB
 */
export interface OIDCUserInfo {
  sub: string; // Subject (user ID)
  name?: string;
  given_name?: string;
  family_name?: string;
  email?: string;
  email_verified?: boolean;
  phone_number?: string;
  phone_number_verified?: boolean;
  preferred_username?: string;
  updated_at?: number;
  // Custom claims
  national_id?: string;
  roles?: string[];
  permissions?: string[];
}
