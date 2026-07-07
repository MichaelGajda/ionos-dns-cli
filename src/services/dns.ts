import { IonosHttpClient } from '../client/http';
import { loadConfig } from '../config';
import {
  DnsZoneSchema,
  DnsZoneListSchema,
  DnsRecordListSchema,
  DnsRecordSchema,
  RecordInputSchema,
  RecordUpdateInputSchema,
  DynDnsResponseSchema,
} from '../schemas/dns';
import type {
  DnsZone,
  DnsZoneSummary,
  DnsRecord,
  RecordInput,
  RecordUpdateInput,
  ZoneQueryParams,
  DynDnsRequest,
  DynDnsResponse,
} from '../types/dns';

export class DnsService {
  private readonly client: IonosHttpClient;

  constructor(client?: IonosHttpClient) {
    this.client = client ?? new IonosHttpClient(loadConfig().dnsBaseUrl);
  }

  // --- Zones ---

  /** List all DNS zones */
  async listZones(): Promise<DnsZoneSummary[]> {
    return this.client.get('/zones', DnsZoneListSchema);
  }

  /** Get zone with records, optional filtering */
  async getZone(zoneId: string, params?: ZoneQueryParams): Promise<DnsZone> {
    const query: Record<string, string | number> = {};
    if (params?.suffix) query.suffix = params.suffix;
    if (params?.recordName) query.recordName = params.recordName;
    if (params?.recordType) query.recordType = params.recordType;
    return this.client.get(`/zones/${zoneId}`, DnsZoneSchema, query);
  }

  /** Find zone by domain name */
  async findZoneByName(name: string): Promise<DnsZoneSummary | undefined> {
    const zones = await this.listZones();
    return zones.find((z) => z.name === name);
  }

  /**
   * PATCH /v1/zones/{zoneId}
   * Replaces all records of the same name AND type with the ones provided.
   * Useful for targeted updates without touching other records.
   * The API returns an empty 200, so we re-fetch the zone to return its new state.
   */
  async patchZoneRecords(zoneId: string, records: RecordInput[]): Promise<DnsZone> {
    for (const r of records) RecordInputSchema.parse(r);
    await this.client.patchRaw(`/zones/${zoneId}`, records);
    return this.getZone(zoneId);
  }

  /**
   * PUT /v1/zones/{zoneId}
   * Replaces ALL records in the zone. Use with caution.
   * The API returns an empty 200, so we re-fetch the zone to return its new state.
   *
   * WARNING: this also drops IONOS-managed records. Once a NATIVE zone is delegated
   * to IONOS, IONOS auto-adds the apex NS + SOA (and a _domainconnect CNAME). Passing a
   * record set without those will REMOVE them and break serving. Include the existing
   * NS/SOA (read them via getZone first) when replacing records on a live zone.
   */
  async replaceAllRecords(zoneId: string, records: RecordInput[]): Promise<DnsZone> {
    for (const r of records) RecordInputSchema.parse(r);
    await this.client.putRaw(`/zones/${zoneId}`, records);
    return this.getZone(zoneId);
  }

  // --- Records ---

  /** Create records in a zone (batch) */
  async createRecords(zoneId: string, records: RecordInput[]): Promise<DnsRecord[]> {
    for (const r of records) RecordInputSchema.parse(r);
    return this.client.post(`/zones/${zoneId}/records`, DnsRecordListSchema, records);
  }

  /** Get a single record */
  async getRecord(zoneId: string, recordId: string): Promise<DnsRecord> {
    return this.client.get(`/zones/${zoneId}/records/${recordId}`, DnsRecordSchema);
  }

  /** Update a single record */
  async updateRecord(zoneId: string, recordId: string, update: RecordUpdateInput): Promise<DnsRecord> {
    RecordUpdateInputSchema.parse(update);
    return this.client.put(`/zones/${zoneId}/records/${recordId}`, DnsRecordSchema, update);
  }

  /** Delete a single record */
  async deleteRecord(zoneId: string, recordId: string): Promise<void> {
    await this.client.delete(`/zones/${zoneId}/records/${recordId}`);
  }

  // --- Dynamic DNS ---

  /** Activate Dynamic DNS for domains (2 req/min limit) */
  async activateDynDns(request: DynDnsRequest): Promise<DynDnsResponse> {
    return this.client.post('/dyndns', DynDnsResponseSchema, request);
  }

  /** Update Dynamic DNS config */
  async updateDynDns(bulkId: string, request: DynDnsRequest): Promise<DynDnsResponse> {
    return this.client.put(`/dyndns/${bulkId}`, DynDnsResponseSchema, request);
  }

  /** Disable all Dynamic DNS */
  async disableAllDynDns(): Promise<void> {
    await this.client.delete('/dyndns');
  }

  /** Disable Dynamic DNS for a specific bulk ID */
  async disableDynDns(bulkId: string): Promise<void> {
    await this.client.delete(`/dyndns/${bulkId}`);
  }
}
