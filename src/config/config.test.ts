import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadConfig } from './index';

const KEYS = ['IONOS_API_KEY', 'IONOS_API_PREFIX', 'IONOS_API_SECRET'] as const;

describe('loadConfig', () => {
  const saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const k of KEYS) {
      saved[k] = process.env[k];
      delete process.env[k];
    }
  });
  afterEach(() => {
    for (const k of KEYS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  });

  it('combines prefix and secret into "prefix.secret"', () => {
    process.env.IONOS_API_PREFIX = 'pfx';
    process.env.IONOS_API_SECRET = 'sec';
    expect(loadConfig().apiKey).toBe('pfx.sec');
  });

  it('prefers IONOS_API_KEY over prefix/secret when both are present', () => {
    process.env.IONOS_API_KEY = 'combined.key';
    process.env.IONOS_API_PREFIX = 'pfx';
    process.env.IONOS_API_SECRET = 'sec';
    expect(loadConfig().apiKey).toBe('combined.key');
  });

  it('throws when no credentials are set', () => {
    expect(() => loadConfig()).toThrowError(/credentials not set/i);
  });

  it('throws when only the prefix is set (secret missing)', () => {
    process.env.IONOS_API_PREFIX = 'pfx';
    expect(() => loadConfig()).toThrowError(/credentials not set/i);
  });

  it('exposes stable base URLs and retry defaults', () => {
    process.env.IONOS_API_KEY = 'x.y';
    const c = loadConfig();
    expect(c.dnsBaseUrl).toBe('https://api.hosting.ionos.com/dns/v1');
    expect(c.domainsBaseUrl).toBe('https://api.hosting.ionos.com/domains/v1');
    expect(c.maxRetries).toBe(3);
    expect(c.defaultPageSize).toBe(100);
  });
});
