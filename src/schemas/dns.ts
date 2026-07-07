import { z } from 'zod';
import { DNS_RECORD_TYPES } from '../types/dns';

const RecordTypeEnum = z.enum(DNS_RECORD_TYPES);
const ZoneTypeEnum = z.enum(['NATIVE', 'SLAVE']);

export const DnsRecordSchema = z.object({
  id: z.string(),
  name: z.string(),
  rootName: z.string(),
  type: RecordTypeEnum,
  content: z.string(),
  changeDate: z.string(),
  ttl: z.number(),
  prio: z.number().optional(),
  disabled: z.boolean(),
});

export const DnsZoneSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: ZoneTypeEnum,
  records: z.array(DnsRecordSchema),
});

export const DnsZoneSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  type: ZoneTypeEnum,
});

export const DnsZoneListSchema = z.array(DnsZoneSummarySchema);
export const DnsRecordListSchema = z.array(DnsRecordSchema);

export const RecordInputSchema = z.object({
  name: z.string().min(1),
  type: RecordTypeEnum,
  content: z.string().min(1),
  ttl: z.number().min(60, 'TTL must be >= 60 seconds'),
  prio: z.number().optional(),
  disabled: z.boolean().optional().default(false),
});

export const RecordUpdateInputSchema = z.object({
  content: z.string().min(1).optional(),
  ttl: z.number().min(60, 'TTL must be >= 60 seconds').optional(),
  prio: z.number().optional(),
  disabled: z.boolean().optional(),
});

export const DynDnsResponseSchema = z.object({
  bulkId: z.string(),
  updateUrl: z.string(),
  domains: z.array(z.string()),
  description: z.string().optional(),
});
