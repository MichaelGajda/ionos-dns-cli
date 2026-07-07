import { z } from 'zod';
import {
  COUNTRY_CODES,
  COMPLIANCE_STATUS_TYPES,
  PROCESS_STATUS_TYPES,
  PROCESS_TRANSFER_STATUSES,
  RUNNING_TRANSFER_STATUSES,
  CONTACT_ROLE_TYPES,
} from '../types/domains';

// --- Status sub-schemas ---

const ComplianceStatusSchema = z.object({
  type: z.enum(COMPLIANCE_STATUS_TYPES),
  registrantEmail: z.string().optional(),
  reason: z.string().optional(),
  verificationPossibleUntilDate: z.string().optional(),
  domainOnHoldAfterTimeout: z.boolean().optional(),
}).optional();

const ProcessStatusSchema = z.object({
  type: z.enum(PROCESS_STATUS_TYPES),
  tenantTransferType: z.enum(['EXTERNAL', 'INTER_TENANT', 'INTRA_TENANT']).optional(),
  transferStatus: z.enum(PROCESS_TRANSFER_STATUSES).optional(),
  transferEndDate: z.string().optional(),
  updateScope: z.array(z.string()).optional(),
  errors: z.array(z.object({
    code: z.string(),
    message: z.string(),
  })).optional(),
}).optional();

const ItemStatusSchema = z.object({
  provisioningStatus: z.object({
    type: z.enum(['REGISTRATION_IN_PROGRESS', 'ACTIVE', 'EXPIRING']),
    registrationType: z.enum(['CREATE', 'TRANSFER', 'SEDO_TRANSFER', 'RESTORE']).optional(),
    setToExpireOn: z.string().optional(),
    setToRenewOn: z.string().optional(),
    isAutorenewSwitchable: z.boolean().optional(),
    revivePossibleUntilDate: z.string().optional(),
  }).optional(),
  complianceStatus: ComplianceStatusSchema,
  processStatus: ProcessStatusSchema,
}).optional();

// --- Core domain schemas ---

export const DomainSmallSchema = z.object({
  id: z.string(),
  name: z.string(),
  encodedName: z.string().optional(),
  tld: z.string(),
  // API omits this field on some list responses (e.g. filtered domainitems), so it is optional.
  pendingProvisioning: z.boolean().optional(),
  status: ItemStatusSchema,
});

export const DomainLargeSchema = DomainSmallSchema.extend({
  authInfo: z.string().optional(),
  privacyEnabled: z.boolean(),
  domainLock: z.boolean(),
  transferLock: z.boolean(),
  autoRenew: z.boolean(),
  expirationDate: z.string(),
  cancellationDate: z.string().optional(),
  dnsSecEnabled: z.boolean(),
  domainType: z.enum(['DOMAIN', 'X_DOMAIN']),
  cancelOnExpire: z.boolean(),
});

export const DomainListResponseSchema = z.object({
  count: z.number(),
  domains: z.array(DomainSmallSchema),
});

// --- Contact schemas ---

const AddressSchema = z.object({
  streets: z.array(z.string()),
  countryCode: z.enum(COUNTRY_CODES),
  postalCode: z.string(),
  state: z.string().optional(),
  city: z.string(),
});

const PostalInfoSchema = z.object({
  salutation: z.string().optional(),
  name: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  organization: z.string().optional(),
  address: AddressSchema,
});

export const ContactSchema = z.object({
  type: z.enum(['USER_DATA', 'HOSTMASTER', 'PRIVATE']),
  postalInfo: PostalInfoSchema,
  voice: z.string().optional(),
  fax: z.string().optional(),
  email: z.string().optional(),
  extensions: z.record(z.unknown()).optional(),
});

export const ContactListSchema = z.array(ContactSchema);

// --- Nameserver schemas ---

const NameserverSchema = z.object({
  name: z.string(),
  ipV4Addresses: z.array(z.string()).optional(),
  ipV6Addresses: z.array(z.string()).optional(),
});

export const NameserverConfigSchema = z.object({
  type: z.enum(['CUSTOM', 'DEFAULT']),
  nameservers: z.array(NameserverSchema),
});

// --- DNSSEC schemas ---

export const DnsSecSchema = z.object({
  secDns: z.object({
    dsData: z.array(z.object({
      digest: z.string(),
      keyTag: z.number(),
      alg: z.number(),
      digestType: z.number(),
    })).optional(),
    keyData: z.array(z.object({
      flags: z.union([z.literal(256), z.literal(257)]),
      protocol: z.number(),
      alg: z.number(),
      pubKey: z.string(),
    })).optional(),
  }),
});

// --- Domain status schemas ---

const DomainStatusReasonSchema = z.object({
  timestamp: z.string().optional(),
  dueDate: z.string().optional(),
  createdBy: z.string().optional(),
  intent: z.string().optional(),
});

const DomainStatusSchema = z.object({
  value: z.boolean(),
  reasons: z.array(DomainStatusReasonSchema).optional(),
});

export const DomainStatusesSchema = z.object({
  clientDeleteProhibited: DomainStatusSchema.optional(),
  clientHold: DomainStatusSchema.optional(),
  clientRenewProhibited: DomainStatusSchema.optional(),
  clientTransferProhibited: DomainStatusSchema.optional(),
  clientUpdateProhibited: DomainStatusSchema.optional(),
});

// --- Request tracking ---

export const RequestIdSchema = z.object({
  id: z.string(),
});

export const RequestResponseSchema = z.object({
  id: z.string(),
  status: z.enum(['PENDING', 'RUNNING', 'FINISHED', 'FAILED', 'CANCELLED', 'EMAIL_VERIFICATION_PENDING', 'EMAIL_VERIFICATION_SUCCESS']),
  type: z.enum(['UPDATE_CONTACTS', 'UPDATE_NAMESERVERS', 'UPDATE_STATUSES', 'UPDATE_PRIVACY', 'UPDATE_DNSSEC', 'GENERATE_AUTHCODE']),
  details: z.string().optional(),
  errors: z.string().optional(),
});

// --- TLD info ---

export const TldInfoSchema = z.object({
  privateRegistrationSupported: z.boolean(),
  idnSupported: z.boolean(),
  authInfoSupported: z.boolean(),
  authInfoChangeSupported: z.boolean(),
  autorenewSupported: z.boolean(),
  renewSupported: z.boolean(),
  transferSupported: z.boolean(),
  restoreSupported: z.boolean(),
  emailVerificationRequired: z.boolean(),
  updateNameserverSupported: z.boolean(),
  glueNameserverSupported: z.boolean(),
  dnsSecSupported: z.boolean(),
  dnsSecInterface: z.enum(['dsData', 'keyData']).optional(),
  clientTransferProhibitedSupported: z.boolean(),
  clientRenewProhibitedSupported: z.boolean(),
  clientUpdateProhibitedSupported: z.boolean(),
  clientDeleteProhibitedSupported: z.boolean(),
  clientHoldSupported: z.boolean(),
  contactTypesSupported: z.array(z.enum(CONTACT_ROLE_TYPES)).optional(),
});

export const TldListSchema = z.array(z.string());

// --- Transfer schemas ---

export const RunningTransferSchema = z.object({
  domainItemId: z.string(),
  domainName: z.string(),
  tld: z.string(),
  transferType: z.enum(['TRANSFER_IN', 'TRANSFER_OUT']),
  tenantTransferType: z.enum(['EXTERNAL', 'INTER_TENANT', 'INTRA_TENANT']),
  transferStatus: z.enum(RUNNING_TRANSFER_STATUSES),
  regcEmail: z.string().optional(),
  foa2EmailAddress: z.string().optional(),
  startDate: z.string().optional(),
  transferEndDate: z.string().optional(),
  autoAckDate: z.string().optional(),
  isSedoTransfer: z.boolean().optional(),
});

export const RunningTransferListSchema = z.array(RunningTransferSchema);
