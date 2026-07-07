/**
 * IONOS Domains API types
 * Source: https://developer.hosting.ionos.de/assets/kms-swagger-specs/domains.yaml (v1.0.4)
 */

// --- Enum constants ---

export const COUNTRY_CODES = [
  'AT', 'AX', 'BE', 'BG', 'CA', 'CY', 'CZ', 'DE', 'DK', 'EE',
  'ES', 'FI', 'FR', 'GF', 'GI', 'GP', 'GR', 'GB', 'HU', 'IE',
  'IS', 'IT', 'LI', 'LT', 'LU', 'LV', 'MQ', 'MT', 'MX', 'NL',
  'NO', 'PL', 'PT', 'RE', 'RO', 'SE', 'SI', 'SK', 'US',
] as const;

export type CountryCode = (typeof COUNTRY_CODES)[number];

export const PROCESS_STATUS_TYPES = [
  'UPDATE_IN_PROGRESS', 'TRANSFER_OUT_IN_PROGRESS', 'TRANSFER_IN_IN_PROGRESS',
  'DELETE_IN_PROGRESS', 'UPDATE_FAILED',
] as const;

export type ProcessStatusType = (typeof PROCESS_STATUS_TYPES)[number];

export const PROCESS_TRANSFER_STATUSES = [
  'WRONG_AUTHINFO', 'TRANSFER_LOCK_SET', 'FOA', 'REGISTRY_PENDING',
  'FOA2', 'RUNNING', 'APPROVED', 'REJECTED', 'CANCELLED',
] as const;

export type ProcessTransferStatus = (typeof PROCESS_TRANSFER_STATUSES)[number];

export const RUNNING_TRANSFER_STATUSES = [
  'PENDING', 'REGISTRY_PENDING', 'FOA', 'WRONG_AUTHINFO',
  'TRANSFER_LOCK_SET', 'WAITING_FOR_RELEASE', 'SIXTY_DAYS_LOCK', 'FOA2', 'RUNNING',
] as const;

export type RunningTransferStatus = (typeof RUNNING_TRANSFER_STATUSES)[number];

export const COMPLIANCE_STATUS_TYPES = [
  'EMAIL_VERIFICATION_RUNNING', 'DATA_QUALITY_RUNNING',
  'NOMINET_LOCKED', 'EMAIL_VERIFICATION_LOCK',
] as const;

export type ComplianceStatusType = (typeof COMPLIANCE_STATUS_TYPES)[number];

export const CONTACT_ROLE_TYPES = ['registrant', 'technical', 'admin'] as const;
export type ContactRoleType = (typeof CONTACT_ROLE_TYPES)[number];

// --- Domain representations ---

export interface DomainSmall {
  id: string;
  name: string;
  encodedName?: string;
  tld: string;
  pendingProvisioning?: boolean;
  status?: ItemStatus;
}

export interface DomainLarge extends DomainSmall {
  authInfo?: string;
  privacyEnabled: boolean;
  domainLock: boolean;
  transferLock: boolean;
  autoRenew: boolean;
  expirationDate: string;
  cancellationDate?: string;
  dnsSecEnabled: boolean;
  domainType: 'DOMAIN' | 'X_DOMAIN';
  cancelOnExpire: boolean;
}

export interface DomainSlim {
  id: string;
  domainType: 'DOMAIN' | 'X_DOMAIN';
  name: string;
  provisioningStatus?: ProvisioningStatusType;
  pendingProvisioning?: boolean;
}

// --- Statuses ---

export interface ItemStatus {
  provisioningStatus?: ProvisioningStatus;
  complianceStatus?: ComplianceStatus;
  processStatus?: ProcessStatus;
}

export interface ProvisioningStatus {
  type: 'REGISTRATION_IN_PROGRESS' | 'ACTIVE' | 'EXPIRING';
  registrationType?: 'CREATE' | 'TRANSFER' | 'SEDO_TRANSFER' | 'RESTORE';
  setToExpireOn?: string;
  setToRenewOn?: string;
  isAutorenewSwitchable?: boolean;
  revivePossibleUntilDate?: string;
}

export type ProvisioningStatusType = ProvisioningStatus;

export interface ComplianceStatus {
  type: ComplianceStatusType;
  registrantEmail?: string;
  reason?: string;
  verificationPossibleUntilDate?: string;
  domainOnHoldAfterTimeout?: boolean;
}

export interface ProcessStatus {
  type: ProcessStatusType;
  tenantTransferType?: 'EXTERNAL' | 'INTER_TENANT' | 'INTRA_TENANT';
  transferStatus?: ProcessTransferStatus;
  transferEndDate?: string;
  updateScope?: string[];
  errors?: Array<{ code: string; message: string }>;
}

// --- Contacts ---

export interface Contact {
  type: 'USER_DATA' | 'HOSTMASTER' | 'PRIVATE';
  postalInfo: PostalInfo;
  voice?: string;
  fax?: string;
  email?: string;
  extensions?: Record<string, unknown>;
}

export interface PostalInfo {
  salutation?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  organization?: string;
  address: Address;
}

export interface Address {
  streets: string[];
  countryCode: CountryCode;
  postalCode: string;
  state?: string;
  city: string;
}

// --- Nameservers ---

export interface Nameserver {
  name: string;
  ipV4Addresses?: string[];
  ipV6Addresses?: string[];
}

export interface NameserverConfig {
  type: 'CUSTOM' | 'DEFAULT';
  nameservers: Nameserver[];
}

// --- DNSSEC ---

export interface DnsSec {
  secDns: {
    dsData?: Array<{
      digest: string;
      keyTag: number;
      alg: number;
      digestType: number;
    }>;
    keyData?: Array<{
      flags: 256 | 257;
      protocol: number;
      alg: number;
      pubKey: string;
    }>;
  };
}

// --- Domain statuses ---

export interface DomainStatusReason {
  timestamp?: string;
  dueDate?: string;
  createdBy?: string;
  intent?: string;
}

export interface DomainStatus {
  value: boolean;
  reasons?: DomainStatusReason[];
}

export interface DomainStatuses {
  clientDeleteProhibited?: DomainStatus;
  clientHold?: DomainStatus;
  clientRenewProhibited?: DomainStatus;
  clientTransferProhibited?: DomainStatus;
  clientUpdateProhibited?: DomainStatus;
}

// --- Transfers ---

export interface RunningTransfer {
  domainItemId: string;
  domainName: string;
  tld: string;
  transferType: 'TRANSFER_IN' | 'TRANSFER_OUT';
  tenantTransferType: 'EXTERNAL' | 'INTER_TENANT' | 'INTRA_TENANT';
  transferStatus: RunningTransferStatus;
  regcEmail?: string;
  foa2EmailAddress?: string;
  startDate?: string;
  transferEndDate?: string;
  autoAckDate?: string;
  isSedoTransfer?: boolean;
}

// --- Request tracking ---

export type RequestStatus = 'PENDING' | 'RUNNING' | 'FINISHED' | 'FAILED' | 'CANCELLED' | 'EMAIL_VERIFICATION_PENDING' | 'EMAIL_VERIFICATION_SUCCESS';
export type RequestType = 'UPDATE_CONTACTS' | 'UPDATE_NAMESERVERS' | 'UPDATE_STATUSES' | 'UPDATE_PRIVACY' | 'UPDATE_DNSSEC' | 'GENERATE_AUTHCODE';

export interface RequestResponse {
  id: string;
  status: RequestStatus;
  type: RequestType;
  details?: string;
  errors?: string;
}

// --- TLD info ---

export interface TldInfo {
  privateRegistrationSupported: boolean;
  idnSupported: boolean;
  authInfoSupported: boolean;
  authInfoChangeSupported: boolean;
  autorenewSupported: boolean;
  renewSupported: boolean;
  transferSupported: boolean;
  restoreSupported: boolean;
  emailVerificationRequired: boolean;
  updateNameserverSupported: boolean;
  glueNameserverSupported: boolean;
  dnsSecSupported: boolean;
  dnsSecInterface?: 'dsData' | 'keyData';
  clientTransferProhibitedSupported: boolean;
  clientRenewProhibitedSupported: boolean;
  clientUpdateProhibitedSupported: boolean;
  clientDeleteProhibitedSupported: boolean;
  clientHoldSupported: boolean;
  contactTypesSupported?: ContactRoleType[];
}

// --- Pagination ---

export interface DomainListParams {
  offset?: number;
  limit?: number;
  tld?: string;
  name?: string;
  label?: string;
  labelPrefix?: string;
  labelSuffix?: string;
  pendingProvisioning?: boolean;
  includeDomainStatus?: boolean;
  sortBy?: 'DOMAIN_NAME' | 'PROVISIONING_START_DATE';
  direction?: 'ASC' | 'DESC';
}

// --- API responses ---

export interface DomainListResponse {
  count: number;
  domains: DomainSmall[];
}

export interface RequestIdResponse {
  id: string;
}
