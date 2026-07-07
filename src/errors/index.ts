/**
 * Error classes for IONOS API client
 */

export class IonosError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string,
    public details?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = 'IonosError';
    Object.setPrototypeOf(this, IonosError.prototype);
  }
}

export class ValidationError extends IonosError {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class NetworkError extends IonosError {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

export class RateLimitError extends IonosError {
  constructor(retryAfterMs?: number) {
    super(`Rate limit exceeded${retryAfterMs ? ` (retry after ${retryAfterMs}ms)` : ''}`);
    this.name = 'RateLimitError';
    this.statusCode = 429;
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}
