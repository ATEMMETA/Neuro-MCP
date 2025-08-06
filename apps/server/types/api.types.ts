# Types for API payloads #TypeSafety
// apps/server/types/api.types.ts

/**
 * Types for API payloads (#TypeSafety)
 */

// Example for agent run API payload (mirroring Zod validation in apiSchema.ts)
export interface RunAgentPayload {
  parameters?: Record<string, unknown>;
  options?: {
    timeoutSeconds?: number;
    priority?: 'low' | 'normal' | 'high';
  };
}

// Example for pagination query parameters
export interface PaginationQuery {
  page?: number;       // Optional because might have defaults on server
  pageSize?: number;
}

// Example for authentication request body
export interface AuthRequest {
  username: string;
  password: string;
}
