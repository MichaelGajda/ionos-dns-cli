import { describe, it, expect, vi } from 'vitest';
import { DnsService } from './dns';
import type { IonosHttpClient } from '../client/http';

// A minimal injectable stand-in for the HTTP client — every method is a spy.
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

const validRecord = { name: 'www', type: 'A', content: '1.2.3.4', ttl: 3600 };

describe('DnsService', () => {
  it('listZones GETs /zones', async () => {
    const c = mockClient({ get: vi.fn().mockResolvedValue([{ id: 'z1', name: 'a.com', type: 'NATIVE' }]) });
    const zones = await new DnsService(c).listZones();
    expect((c as any).get).toHaveBeenCalledWith('/zones', expect.anything());
    expect(zones[0].name).toBe('a.com');
  });

  it('getZone builds the record filter query from params', async () => {
    const c = mockClient({ get: vi.fn().mockResolvedValue({}) });
    await new DnsService(c).getZone('z1', { recordType: 'A', suffix: 'x.com' });
    expect((c as any).get).toHaveBeenCalledWith('/zones/z1', expect.anything(), { suffix: 'x.com', recordType: 'A' });
  });

  it('getZone sends an empty query when no params are given', async () => {
    const c = mockClient({ get: vi.fn().mockResolvedValue({}) });
    await new DnsService(c).getZone('z1');
    expect((c as any).get).toHaveBeenCalledWith('/zones/z1', expect.anything(), {});
  });

  it('findZoneByName returns the match, or undefined when absent', async () => {
    const c = mockClient({
      get: vi.fn().mockResolvedValue([
        { id: '1', name: 'a.com', type: 'NATIVE' },
        { id: '2', name: 'b.com', type: 'NATIVE' },
      ]),
    });
    expect((await new DnsService(c).findZoneByName('b.com'))?.id).toBe('2');
    expect(await new DnsService(c).findZoneByName('none.com')).toBeUndefined();
  });

  it('createRecords rejects invalid input BEFORE hitting the API', async () => {
    const c = mockClient();
    await expect(
      new DnsService(c).createRecords('z1', [{ name: 'www', type: 'A', content: '1.2.3.4', ttl: 30 }])
    ).rejects.toThrow();
    expect((c as any).post).not.toHaveBeenCalled();
  });

  it('createRecords POSTs to /zones/{id}/records for valid input', async () => {
    const c = mockClient({ post: vi.fn().mockResolvedValue([{ ...validRecord, id: 'r1', rootName: 'a.com', changeDate: '2026-01-01T00:00:00Z', disabled: false }]) });
    await new DnsService(c).createRecords('z1', [validRecord]);
    expect((c as any).post).toHaveBeenCalledWith('/zones/z1/records', expect.anything(), expect.any(Array));
  });

  it('updateRecord PUTs the update to the record path', async () => {
    const c = mockClient({ put: vi.fn().mockResolvedValue({ ...validRecord, id: 'r1', rootName: 'a.com', changeDate: '2026-01-01T00:00:00Z', disabled: false }) });
    await new DnsService(c).updateRecord('z1', 'r1', { ttl: 7200 });
    expect((c as any).put).toHaveBeenCalledWith('/zones/z1/records/r1', expect.anything(), { ttl: 7200 });
  });

  it('deleteRecord DELETEs the record path', async () => {
    const c = mockClient();
    await new DnsService(c).deleteRecord('z1', 'r1');
    expect((c as any).delete).toHaveBeenCalledWith('/zones/z1/records/r1');
  });

  it('patchZoneRecords PATCHes raw then re-fetches the zone', async () => {
    const c = mockClient({
      patchRaw: vi.fn().mockResolvedValue(undefined),
      get: vi.fn().mockResolvedValue({ id: 'z1', name: 'a.com', type: 'NATIVE', records: [] }),
    });
    await new DnsService(c).patchZoneRecords('z1', [validRecord]);
    expect((c as any).patchRaw).toHaveBeenCalledWith('/zones/z1', expect.any(Array));
    expect((c as any).get).toHaveBeenCalledWith('/zones/z1', expect.anything(), {});
  });
});
