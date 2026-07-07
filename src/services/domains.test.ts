import { describe, it, expect, vi } from 'vitest';
import { DomainsService } from './domains';
import type { IonosHttpClient } from '../client/http';

function mockClient(overrides: Partial<Record<string, unknown>> = {}) {
  const base = {
    get: vi.fn().mockResolvedValue(undefined),
    post: vi.fn().mockResolvedValue(undefined),
    put: vi.fn().mockResolvedValue(undefined),
    patch: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    getRaw: vi.fn().mockResolvedValue(undefined),
    putRaw: vi.fn().mockResolvedValue(undefined),
    patchRaw: vi.fn().mockResolvedValue(undefined),
  };
  return { ...base, ...overrides } as unknown as IonosHttpClient & Record<string, ReturnType<typeof vi.fn>>;
}

describe('DomainsService', () => {
  it('listDomains GETs /domainitems and maps params to the query (booleans → 0/1)', async () => {
    const c = mockClient({ get: vi.fn().mockResolvedValue({ domains: [], count: 0 }) });
    await new DomainsService(c).listDomains({
      limit: 10,
      offset: 5,
      tld: 'com',
      pendingProvisioning: false,
      includeDomainStatus: true,
    });
    expect((c as any).get).toHaveBeenCalledWith('/domainitems', expect.anything(), {
      offset: 5,
      limit: 10,
      tld: 'com',
      pendingProvisioning: 0,
      includeDomainStatus: 1,
    });
  });

  it('listDomains sends an empty query when no params are given', async () => {
    const c = mockClient({ get: vi.fn().mockResolvedValue({ domains: [], count: 0 }) });
    await new DomainsService(c).listDomains();
    expect((c as any).get).toHaveBeenCalledWith('/domainitems', expect.anything(), {});
  });

  it('getDomain adds includeDomainStatus=1 only when requested', async () => {
    const c = mockClient({ get: vi.fn().mockResolvedValue({}) });
    const svc = new DomainsService(c);
    await svc.getDomain('d1');
    expect((c as any).get).toHaveBeenCalledWith('/domainitems/d1', expect.anything(), {});
    await svc.getDomain('d1', true);
    expect((c as any).get).toHaveBeenLastCalledWith('/domainitems/d1', expect.anything(), { includeDomainStatus: 1 });
  });

  it('findDomainByName returns the first match, or undefined', async () => {
    const withOne = mockClient({ get: vi.fn().mockResolvedValue({ domains: [{ id: 'd1', name: 'x.com' }], count: 1 }) });
    expect((await new DomainsService(withOne).findDomainByName('x'))?.id).toBe('d1');
    const empty = mockClient({ get: vi.fn().mockResolvedValue({ domains: [], count: 0 }) });
    expect(await new DomainsService(empty).findDomainByName('nope')).toBeUndefined();
  });

  it('getContacts and getNameservers hit the right sub-resources', async () => {
    const c = mockClient({ get: vi.fn().mockResolvedValue([]) });
    const svc = new DomainsService(c);
    await svc.getContacts('d1');
    expect((c as any).get).toHaveBeenCalledWith('/domainitems/d1/contacts', expect.anything());
    await svc.getNameservers('d1');
    expect((c as any).get).toHaveBeenLastCalledWith('/domainitems/d1/nameservers', expect.anything());
  });

  it('getRunningTransfers, listTlds and getTldInfo use their fixed paths', async () => {
    const c = mockClient({ get: vi.fn().mockResolvedValue([]) });
    const svc = new DomainsService(c);
    await svc.getRunningTransfers();
    expect((c as any).get).toHaveBeenCalledWith('/domainitems/transfers/running', expect.anything());
    await svc.listTlds();
    expect((c as any).get).toHaveBeenLastCalledWith('/tlds', expect.anything());
    await svc.getTldInfo('de');
    expect((c as any).get).toHaveBeenLastCalledWith('/tlds/de', expect.anything());
  });

  it('getRequest checks the request-tracking endpoint', async () => {
    const c = mockClient({ get: vi.fn().mockResolvedValue({}) });
    await new DomainsService(c).getRequest('req-1');
    expect((c as any).get).toHaveBeenCalledWith('/requests/req-1', expect.anything());
  });

  it('explore and getAuthCode go through the raw (unvalidated) client', async () => {
    const c = mockClient({ getRaw: vi.fn().mockResolvedValue('raw') });
    const svc = new DomainsService(c);
    await svc.explore('/some/raw/path');
    expect((c as any).getRaw).toHaveBeenCalledWith('/some/raw/path');
    await svc.getAuthCode('d1');
    expect((c as any).getRaw).toHaveBeenLastCalledWith('/domainitems/d1/authcode');
  });
});
