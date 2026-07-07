import { z } from 'zod';
import { loadConfig, type IonosConfig } from '../config';
import { IonosError, NetworkError, RateLimitError, ValidationError } from '../errors';
import { validateResponse } from '../schemas';

export class IonosHttpClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly retryAttempts: number;
  private readonly retryDelayMs: number;

  constructor(baseUrl: string, config?: IonosConfig) {
    const cfg = config ?? loadConfig();
    this.apiKey = cfg.apiKey;
    this.baseUrl = baseUrl;
    this.retryAttempts = cfg.maxRetries;
    this.retryDelayMs = cfg.retryDelayMs;
  }

  private buildUrl(path: string, query?: Record<string, string | number>): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const url = new URL(`${this.baseUrl}${normalizedPath}`);

    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    return url.toString();
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    options?: {
      body?: unknown;
      query?: Record<string, string | number>;
    }
  ): Promise<T> {
    const url = this.buildUrl(path, options?.query);

    const headers: Record<string, string> = {
      'X-API-Key': this.apiKey,
      Accept: 'application/json',
    };

    const fetchOptions: RequestInit = { method, headers };

    if (options?.body !== undefined) {
      headers['Content-Type'] = 'application/json';
      fetchOptions.body = JSON.stringify(options.body);
    }

    const response = await fetch(url, fetchOptions);

    // 204 No Content — return empty
    if (response.status === 204) {
      return undefined as T;
    }

    const text = await response.text();
    let data: unknown;
    try {
      data = text ? JSON.parse(text) : undefined;
    } catch {
      data = undefined;
    }

    if (!response.ok) {
      const errBody = data as Record<string, unknown> | undefined;
      throw new IonosError(
        (errBody?.message as string) || `HTTP ${response.status}`,
        response.status,
        errBody?.code as string | undefined,
        errBody?.details as Array<{ field: string; message: string }> | undefined
      );
    }

    return data as T;
  }

  private async requestWithRetry<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    options?: {
      body?: unknown;
      query?: Record<string, string | number>;
    }
  ): Promise<T> {
    let attempt = 0;

    while (true) {
      try {
        return await this.request<T>(method, path, options);
      } catch (error) {
        if (error instanceof Error && !(error instanceof IonosError)) {
          throw new NetworkError(error.message, error);
        }

        if (error instanceof IonosError && error.statusCode === 429) {
          if (attempt < this.retryAttempts) {
            const delay = this.retryDelayMs * 2 ** attempt;
            await new Promise((resolve) => setTimeout(resolve, delay));
            attempt++;
            continue;
          }
          throw new RateLimitError();
        }

        throw error;
      }
    }
  }

  async get<T>(path: string, schema: z.ZodSchema<T>, query?: Record<string, string | number>): Promise<T> {
    try {
      const data = await this.requestWithRetry<unknown>('GET', path, { query });
      return validateResponse(data, schema);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Validation failed')) {
        throw new ValidationError(error.message);
      }
      throw error;
    }
  }

  async post<T>(path: string, schema: z.ZodSchema<T>, body: unknown): Promise<T> {
    try {
      const data = await this.requestWithRetry<unknown>('POST', path, { body });
      return validateResponse(data, schema);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Validation failed')) {
        throw new ValidationError(error.message);
      }
      throw error;
    }
  }

  async put<T>(path: string, schema: z.ZodSchema<T>, body: unknown): Promise<T> {
    try {
      const data = await this.requestWithRetry<unknown>('PUT', path, { body });
      return validateResponse(data, schema);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Validation failed')) {
        throw new ValidationError(error.message);
      }
      throw error;
    }
  }

  async patch<T>(path: string, schema: z.ZodSchema<T>, body: unknown): Promise<T> {
    try {
      const data = await this.requestWithRetry<unknown>('PATCH', path, { body });
      return validateResponse(data, schema);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Validation failed')) {
        throw new ValidationError(error.message);
      }
      throw error;
    }
  }

  async delete(path: string): Promise<void> {
    await this.requestWithRetry<void>('DELETE', path);
  }

  /**
   * Raw GET without schema validation — for exploring endpoints.
   */
  async getRaw<T = unknown>(path: string, query?: Record<string, string | number>): Promise<T> {
    return this.requestWithRetry<T>('GET', path, { query });
  }

  /**
   * Raw PUT without schema validation — for endpoints that return an empty 200
   * (e.g. PUT /zones/{zoneId}, which replaces all records and returns no body).
   */
  async putRaw<T = unknown>(path: string, body: unknown): Promise<T> {
    return this.requestWithRetry<T>('PUT', path, { body });
  }

  /**
   * Raw PATCH without schema validation — for endpoints that return an empty 200
   * (e.g. PATCH /zones/{zoneId}).
   */
  async patchRaw<T = unknown>(path: string, body: unknown): Promise<T> {
    return this.requestWithRetry<T>('PATCH', path, { body });
  }
}
