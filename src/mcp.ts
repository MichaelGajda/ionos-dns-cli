#!/usr/bin/env node
/**
 * MCP server for the IONOS Hosting API.
 *
 * Exposes the same DNS/domains capabilities as the CLI, as Model Context
 * Protocol tools — so an LLM client can manage DNS conversationally.
 * Auth is the same as the CLI: IONOS_API_PREFIX + IONOS_API_SECRET (or
 * IONOS_API_KEY) in the server process environment.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { DnsService } from './services/dns';
import { DomainsService } from './services/domains';
import { RecordInputSchema } from './schemas/dns';
import { IonosError } from './errors';
import { VERSION } from './version';

// Lazy so the server starts (and can list its tools) even without credentials;
// only an actual API call needs them.
let _dns: DnsService | undefined;
let _domains: DomainsService | undefined;
const dns = () => (_dns ??= new DnsService());
const domains = () => (_domains ??= new DomainsService());

type Result = { content: Array<{ type: 'text'; text: string }>; isError?: boolean };
const ok = (data: unknown): Result => ({
  content: [{ type: 'text', text: typeof data === 'string' ? data : JSON.stringify(data, null, 2) }],
});
const fail = (e: unknown): Result => ({
  isError: true,
  content: [
    {
      type: 'text',
      text:
        e instanceof IonosError
          ? `IONOS API error (${e.statusCode ?? '?'}): ${e.message}`
          : e instanceof Error
            ? e.message
            : String(e),
    },
  ],
});
const run = async (fn: () => Promise<unknown>): Promise<Result> => {
  try {
    return ok(await fn());
  } catch (e) {
    return fail(e);
  }
};

const server = new McpServer({ name: 'ionosdns', version: VERSION });

// --- DNS: read ---

server.registerTool(
  'list_zones',
  { description: 'List all DNS zones in the account.', inputSchema: {}, annotations: { readOnlyHint: true } },
  async () => run(() => dns().listZones())
);

server.registerTool(
  'get_zone',
  {
    description: 'Get a DNS zone with its records. Optionally filter the records.',
    inputSchema: {
      zoneId: z.string().describe('Zone UUID'),
      recordType: z.string().optional().describe('Comma-separated types, e.g. "A,MX"'),
      recordName: z.string().optional(),
      suffix: z.string().optional(),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ zoneId, recordType, recordName, suffix }) =>
    run(() => dns().getZone(zoneId, { recordType, recordName, suffix }))
);

server.registerTool(
  'find_zone',
  {
    description: 'Find a DNS zone by its exact domain name.',
    inputSchema: { name: z.string().describe('Domain name, e.g. example.com') },
    annotations: { readOnlyHint: true },
  },
  async ({ name }) => run(() => dns().findZoneByName(name))
);

server.registerTool(
  'get_record',
  {
    description: 'Get a single DNS record.',
    inputSchema: { zoneId: z.string(), recordId: z.string() },
    annotations: { readOnlyHint: true },
  },
  async ({ zoneId, recordId }) => run(() => dns().getRecord(zoneId, recordId))
);

// --- DNS: write ---

server.registerTool(
  'create_records',
  {
    description: 'Create one or more DNS records in a zone.',
    inputSchema: { zoneId: z.string(), records: z.array(RecordInputSchema).min(1) },
  },
  async ({ zoneId, records }) => run(() => dns().createRecords(zoneId, records))
);

server.registerTool(
  'update_record',
  {
    description: 'Update a single DNS record (content / ttl / prio / disabled).',
    inputSchema: {
      zoneId: z.string(),
      recordId: z.string(),
      content: z.string().optional(),
      ttl: z.number().min(60).optional(),
      prio: z.number().optional(),
      disabled: z.boolean().optional(),
    },
  },
  async ({ zoneId, recordId, ...update }) => run(() => dns().updateRecord(zoneId, recordId, update))
);

server.registerTool(
  'delete_record',
  {
    description: 'Delete a single DNS record. Irreversible.',
    inputSchema: { zoneId: z.string(), recordId: z.string() },
    annotations: { destructiveHint: true },
  },
  async ({ zoneId, recordId }) =>
    run(async () => {
      await dns().deleteRecord(zoneId, recordId);
      return `Deleted record ${recordId} from zone ${zoneId}.`;
    })
);

// --- Domains: read ---

server.registerTool(
  'list_domains',
  {
    description: 'List domains, with optional filters and pagination.',
    inputSchema: {
      limit: z.number().optional(),
      offset: z.number().optional(),
      tld: z.string().optional(),
      name: z.string().optional(),
    },
    annotations: { readOnlyHint: true },
  },
  async (params) => run(() => domains().listDomains(params))
);

server.registerTool(
  'get_domain',
  {
    description: 'Get detailed info for a domain.',
    inputSchema: { domainId: z.string() },
    annotations: { readOnlyHint: true },
  },
  async ({ domainId }) => run(() => domains().getDomain(domainId))
);

server.registerTool(
  'list_tlds',
  { description: 'List all supported TLDs.', inputSchema: {}, annotations: { readOnlyHint: true } },
  async () => run(() => domains().listTlds())
);

server.registerTool(
  'explore',
  {
    description: 'GET a raw IONOS API path, for discovery. Read-only.',
    inputSchema: { path: z.string().describe('Raw path, e.g. /zones') },
    annotations: { readOnlyHint: true },
  },
  async ({ path }) => run(() => domains().explore(path))
);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Log to stderr — stdout is the JSON-RPC channel and must stay clean.
  console.error('ionosdns MCP server running on stdio');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
