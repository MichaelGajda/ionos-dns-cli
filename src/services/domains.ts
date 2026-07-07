import { IonosHttpClient } from '../client/http';
import { loadConfig } from '../config';
import {
  DomainListResponseSchema,
  DomainLargeSchema,
  ContactListSchema,
  NameserverConfigSchema,
  DomainStatusesSchema,
  DnsSecSchema,
  RequestIdSchema,
  RequestResponseSchema,
  TldInfoSchema,
  TldListSchema,
  RunningTransferListSchema,
} from '../schemas/domains';
import type {
  DomainSmall,
  DomainLarge,
  DomainListParams,
  DomainListResponse,
  Contact,
  NameserverConfig,
  RequestResponse,
  RequestIdResponse,
  TldInfo,
  RunningTransfer,
  DomainStatuses,
  DnsSec,
} from '../types/domains';

export class DomainsService {
  private readonly client: IonosHttpClient;

  constructor(client?: IonosHttpClient) {
    this.client = client ?? new IonosHttpClient(loadConfig().domainsBaseUrl);
  }

  // --- Domains ---

  /** List domains with filtering and pagination */
  async listDomains(params?: DomainListParams): Promise<DomainListResponse> {
    const query: Record<string, string | number> = {};
    if (params?.offset !== undefined) query.offset = params.offset;
    if (params?.limit !== undefined) query.limit = params.limit;
    if (params?.tld) query.tld = params.tld;
    if (params?.name) query.name = params.name;
    if (params?.label) query.label = params.label;
    if (params?.labelPrefix) query.labelPrefix = params.labelPrefix;
    if (params?.labelSuffix) query.labelSuffix = params.labelSuffix;
    if (params?.pendingProvisioning !== undefined) query.pendingProvisioning = params.pendingProvisioning ? 1 : 0;
    if (params?.includeDomainStatus) query.includeDomainStatus = 1;
    if (params?.sortBy) query.sortBy = params.sortBy;
    if (params?.direction) query.direction = params.direction;

    return this.client.get('/domainitems', DomainListResponseSchema, query);
  }

  /** Get detailed domain info */
  async getDomain(domainId: string, includeDomainStatus = false): Promise<DomainLarge> {
    const query: Record<string, string | number> = {};
    if (includeDomainStatus) query.includeDomainStatus = 1;
    return this.client.get(`/domainitems/${domainId}`, DomainLargeSchema, query);
  }

  /** Find domain by name (substring search, min 3 chars) */
  async findDomainByName(name: string): Promise<DomainSmall | undefined> {
    const result = await this.listDomains({ name, limit: 1 });
    return result.domains[0];
  }

  // --- Contacts ---

  /** Get locally stored contacts */
  async getContacts(domainId: string): Promise<Contact[]> {
    return this.client.get(`/domainitems/${domainId}/contacts`, ContactListSchema);
  }

  /** Get registry contacts (may differ from local if privacy enabled) */
  async getRegistryContacts(domainId: string): Promise<Contact[]> {
    return this.client.get(`/domainitems/${domainId}/registrycontacts`, ContactListSchema);
  }

  /** Update domain contacts */
  async updateContacts(domainId: string, contacts: Contact[]): Promise<RequestIdResponse> {
    return this.client.put(`/domainitems/${domainId}/contacts`, RequestIdSchema, contacts);
  }

  // --- Nameservers ---

  /** Get nameserver config */
  async getNameservers(domainId: string): Promise<NameserverConfig> {
    return this.client.get(`/domainitems/${domainId}/nameservers`, NameserverConfigSchema);
  }

  /** Update nameservers */
  async updateNameservers(domainId: string, config: NameserverConfig): Promise<RequestIdResponse> {
    return this.client.put(`/domainitems/${domainId}/nameservers`, RequestIdSchema, config);
  }

  // --- Domain statuses ---

  /** Get domain status flags */
  async getDomainStatuses(domainId: string): Promise<DomainStatuses> {
    return this.client.get(`/domainitems/${domainId}/domainstatuses`, DomainStatusesSchema);
  }

  /** Update domain status flags */
  async updateDomainStatuses(domainId: string, statuses: { domainStatuses: DomainStatuses }): Promise<RequestIdResponse> {
    return this.client.put(`/domainitems/${domainId}/domainstatuses`, RequestIdSchema, statuses);
  }

  // --- DNSSEC ---

  /** Get DNSSEC config */
  async getDnsSec(domainId: string): Promise<DnsSec> {
    return this.client.get(`/domainitems/${domainId}/dnssec`, DnsSecSchema);
  }

  /** Update DNSSEC config */
  async updateDnsSec(domainId: string, config: DnsSec): Promise<RequestIdResponse> {
    return this.client.put(`/domainitems/${domainId}/dnssec`, RequestIdSchema, config);
  }

  // --- Privacy ---

  /** Get privacy status */
  async getPrivacy(domainId: string): Promise<{ enabled: boolean }> {
    return this.client.getRaw(`/domainitems/${domainId}/privacy`) as Promise<{ enabled: boolean }>;
  }

  /** Enable/disable privacy */
  async setPrivacy(domainId: string, enabled: boolean): Promise<RequestIdResponse> {
    return this.client.put(`/domainitems/${domainId}/privacy`, RequestIdSchema, { enabled });
  }

  // --- Auth code ---

  /** Get authorization code for transfer */
  async getAuthCode(domainId: string): Promise<string> {
    return this.client.getRaw(`/domainitems/${domainId}/authcode`) as Promise<string>;
  }

  /** Regenerate auth code */
  async regenerateAuthCode(domainId: string): Promise<RequestIdResponse> {
    return this.client.post(`/domainitems/${domainId}/authcode`, RequestIdSchema, {});
  }

  // --- Transfers ---

  /** Get running transfers */
  async getRunningTransfers(): Promise<RunningTransfer[]> {
    return this.client.get('/domainitems/transfers/running', RunningTransferListSchema);
  }

  // --- Request tracking ---

  /** Check status of an update request */
  async getRequest(requestId: string): Promise<RequestResponse> {
    return this.client.get(`/requests/${requestId}`, RequestResponseSchema);
  }

  // --- TLD info ---

  /** List supported TLDs */
  async listTlds(): Promise<string[]> {
    return this.client.get('/tlds', TldListSchema);
  }

  /** Get TLD capabilities */
  async getTldInfo(tld: string): Promise<TldInfo> {
    return this.client.get(`/tlds/${tld}`, TldInfoSchema);
  }

  // --- Validation ---

  /** Validate domain names */
  async validateDomainNames(names: string[]): Promise<unknown> {
    return this.client.getRaw('/domainitems/domain-names/validation');
  }

  /** Explore raw endpoint (for API discovery) */
  async explore(path: string): Promise<unknown> {
    return this.client.getRaw(path);
  }
}
