import { describe, it, expect } from 'vitest';
import { IonosError, ValidationError, NetworkError, RateLimitError } from './index';

describe('error classes', () => {
  it('IonosError carries statusCode, code and field details', () => {
    const e = new IonosError('boom', 400, 'BAD', [{ field: 'name', message: 'required' }]);
    expect(e).toBeInstanceOf(Error);
    expect(e.statusCode).toBe(400);
    expect(e.code).toBe('BAD');
    expect(e.details?.[0].field).toBe('name');
    expect(e.name).toBe('IonosError');
  });

  it('ValidationError is an IonosError', () => {
    const e = new ValidationError('bad payload');
    expect(e).toBeInstanceOf(IonosError);
    expect(e.name).toBe('ValidationError');
  });

  it('NetworkError keeps the original error', () => {
    const orig = new Error('socket hang up');
    const e = new NetworkError('connection failed', orig);
    expect(e.originalError).toBe(orig);
    expect(e).toBeInstanceOf(IonosError);
  });

  it('RateLimitError defaults to status 429 and mentions the retry delay', () => {
    const e = new RateLimitError(500);
    expect(e.statusCode).toBe(429);
    expect(e.message).toMatch(/retry after 500ms/);
  });
});
