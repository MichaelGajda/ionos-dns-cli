import { describe, it, expect } from 'vitest';
import { DnsRecordSchema, RecordInputSchema, DnsZoneSchema } from './dns';
import { validateResponse } from './index';

const validRecord = {
  id: 'rec1',
  name: 'www.example.com',
  rootName: 'example.com',
  type: 'A',
  content: '1.2.3.4',
  changeDate: '2026-01-01T00:00:00Z',
  ttl: 3600,
  disabled: false,
};

describe('DnsRecordSchema', () => {
  it('accepts a valid record', () => {
    expect(DnsRecordSchema.parse(validRecord).id).toBe('rec1');
  });
  it('rejects an unknown record type', () => {
    expect(() => DnsRecordSchema.parse({ ...validRecord, type: 'NOPE' })).toThrow();
  });
  it('rejects a non-numeric ttl', () => {
    expect(() => DnsRecordSchema.parse({ ...validRecord, ttl: 'soon' })).toThrow();
  });
});

describe('RecordInputSchema', () => {
  it('defaults disabled to false', () => {
    const r = RecordInputSchema.parse({ name: 'a', type: 'A', content: '1.2.3.4', ttl: 3600 });
    expect(r.disabled).toBe(false);
  });
  it('rejects a ttl below 60', () => {
    expect(() =>
      RecordInputSchema.parse({ name: 'a', type: 'A', content: '1.2.3.4', ttl: 30 })
    ).toThrowError(/TTL must be >= 60/);
  });
  it('rejects empty content', () => {
    expect(() =>
      RecordInputSchema.parse({ name: 'a', type: 'A', content: '', ttl: 3600 })
    ).toThrow();
  });
});

describe('DnsZoneSchema', () => {
  it('parses a zone with nested records', () => {
    const zone = { id: 'z1', name: 'example.com', type: 'NATIVE', records: [validRecord] };
    expect(DnsZoneSchema.parse(zone).records).toHaveLength(1);
  });
  it('rejects an invalid zone type', () => {
    expect(() =>
      DnsZoneSchema.parse({ id: 'z1', name: 'example.com', type: 'X', records: [] })
    ).toThrow();
  });
});

describe('validateResponse', () => {
  it('returns typed data on success', () => {
    expect(validateResponse(validRecord, DnsRecordSchema).content).toBe('1.2.3.4');
  });
  it('throws a helpful error listing the failing path', () => {
    expect(() => validateResponse({ id: 1 }, DnsRecordSchema)).toThrowError(/Validation failed/);
  });
});
