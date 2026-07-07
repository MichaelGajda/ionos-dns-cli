/**
 * IONOS DNS API types
 * Source: https://developer.hosting.ionos.de/assets/kms-swagger-specs/dns.yaml (v1.0.2)
 */

export const DNS_RECORD_TYPES = [
  'A', 'AAAA', 'CNAME', 'MX', 'NS', 'SOA', 'SRV', 'TXT', 'CAA',
  'TLSA', 'SMIMEA', 'SSHFP', 'DS', 'HTTPS', 'SVCB', 'CERT',
  'URI', 'RP', 'LOC', 'OPENPGPKEY',
] as const;

export type DnsRecordType = (typeof DNS_RECORD_TYPES)[number];

export type DnsZoneType = 'NATIVE' | 'SLAVE';

/** Record as returned by the API */
export interface DnsRecord {
  id: string;
  name: string;
  rootName: string;
  type: DnsRecordType;
  content: string;
  changeDate: string;
  ttl: number;
  prio?: number;
  disabled: boolean;
}

/** Zone with records (GET /v1/zones/{zoneId}) */
export interface DnsZone {
  id: string;
  name: string;
  type: DnsZoneType;
  records: DnsRecord[];
}

/** Zone summary (GET /v1/zones list item) */
export interface DnsZoneSummary {
  id: string;
  name: string;
  type: DnsZoneType;
}

/** Input for creating/replacing records */
export interface RecordInput {
  name: string;
  type: DnsRecordType;
  content: string;
  ttl: number;
  prio?: number;
  disabled?: boolean;
}

/** Input for updating a single record (all fields optional for partial update) */
export interface RecordUpdateInput {
  content?: string;
  ttl?: number;
  prio?: number;
  disabled?: boolean;
}

/** GET /v1/zones/{zoneId} query params */
export interface ZoneQueryParams {
  suffix?: string;
  recordName?: string;
  recordType?: string; // comma-separated types
}

/** Dynamic DNS types */
export interface DynDnsRequest {
  domains: string[];
  description?: string;
}

export interface DynDnsResponse {
  bulkId: string;
  updateUrl: string;
  domains: string[];
  description?: string;
}
