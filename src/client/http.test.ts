import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';
import { IonosHttpClient } from './http';
import { IonosError, NetworkError, RateLimitError, ValidationError } from '../errors';
import type { IonosConfig } from '../config';

const cfg: IonosConfig = {
  apiKey: 'pfx.sec',
  dnsBaseUrl: 'https://api.test/dns/v1',
  domainsBaseUrl: 'https://api.test/domains/v1',
  maxRetries: 2,
  retryDelayMs: 0, // no real waiting in tests
  timeoutMs: 1000,
  defaultPageSize: 100,
};

const S = z.object({ id: z.string() });
const client = () => new IonosHttpClient('https://api.test', cfg);
const resp = (status: number, body: unknown, ok?: boolean) => ({
  ok: ok ?? (status >= 200 && status < 300),
  status,
  text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
});

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe('IonosHttpClient', () => {
  it('sends the X-API-Key header and serializes query params (dropping undefined)', async () => {
    fetchMock.mockResolvedValue(resp(200, { id: 'x' }));
    await client().get('/zones', S, { a: 1, b: undefined as unknown as string });
    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.test/zones?a=1');
    expect((opts.headers as Record<string, string>)['X-API-Key']).toBe('pfx.sec');
    expect(opts.method).toBe('GET');
  });

  it('validates and returns the parsed body on 200', async () => {
    fetchMock.mockResolvedValue(resp(200, { id: 'abc' }));
    expect(await client().get('/x', S)).toEqual({ id: 'abc' });
  });

  it('throws ValidationError when the response does not match the schema', async () => {
    fetchMock.mockResolvedValue(resp(200, { id: 123 }));
    await expect(client().get('/x', S)).rejects.toBeInstanceOf(ValidationError);
  });

  it('maps a non-2xx response to an IonosError with status, message and details', async () => {
    fetchMock.mockResolvedValue(
      resp(400, { message: 'bad request', code: 'INVALID', details: [{ field: 'ttl', message: 'too low' }] })
    );
    const err = await client().get('/x', S).catch((e) => e);
    expect(err).toBeInstanceOf(IonosError);
    expect(err.statusCode).toBe(400);
    expect(err.message).toBe('bad request');
    expect(err.details[0].field).toBe('ttl');
  });

  it('retries on 429 and succeeds', async () => {
    fetchMock
      .mockResolvedValueOnce(resp(429, { message: 'rate limited' }))
      .mockResolvedValueOnce(resp(200, { id: 'ok' }));
    expect(await client().get('/x', S)).toEqual({ id: 'ok' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('gives up after maxRetries on persistent 429 and throws RateLimitError', async () => {
    fetchMock.mockResolvedValue(resp(429, { message: 'rate limited' }));
    await expect(client().get('/x', S)).rejects.toBeInstanceOf(RateLimitError);
    expect(fetchMock).toHaveBeenCalledTimes(3); // initial + 2 retries
  });

  it('wraps a network/transport failure in NetworkError', async () => {
    fetchMock.mockRejectedValue(new Error('ECONNREFUSED'));
    await expect(client().get('/x', S)).rejects.toBeInstanceOf(NetworkError);
  });

  it('treats 204 No Content as an empty success (delete resolves)', async () => {
    fetchMock.mockResolvedValue(resp(204, ''));
    await expect(client().delete('/x')).resolves.toBeUndefined();
  });

  it('sends a JSON body and Content-Type on POST', async () => {
    fetchMock.mockResolvedValue(resp(200, { id: 'p' }));
    await client().post('/x', S, { a: 1 });
    const opts = fetchMock.mock.calls[0][1];
    expect(opts.method).toBe('POST');
    expect((opts.headers as Record<string, string>)['Content-Type']).toBe('application/json');
    expect(JSON.parse(opts.body as string)).toEqual({ a: 1 });
  });

  it('getRaw returns the body without schema validation', async () => {
    fetchMock.mockResolvedValue(resp(200, { anything: true, nested: { ok: 1 } }));
    expect(await client().getRaw('/x')).toEqual({ anything: true, nested: { ok: 1 } });
  });
});
