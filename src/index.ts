/**
 * IONOS Hosting API client — importable library
 *
 * Usage:
 *   import { DnsService, DomainsService } from 'gyv-ionos-cli';
 *
 *   const dns = new DnsService();
 *   const zones = await dns.listZones();
 */

export { DnsService } from './services/dns';
export { DomainsService } from './services/domains';
export { IonosHttpClient } from './client/http';
export { loadConfig, getConfig, type IonosConfig } from './config';
export { IonosError, NetworkError, RateLimitError, ValidationError } from './errors';
export * from './types/dns';
export * from './types/domains';
export { VERSION } from './version';
