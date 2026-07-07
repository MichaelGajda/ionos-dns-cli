export interface IonosConfig {
  apiKey: string;
  dnsBaseUrl: string;
  domainsBaseUrl: string;
  maxRetries: number;
  retryDelayMs: number;
  timeoutMs: number;
  defaultPageSize: number;
}

/**
 * Load IONOS configuration from environment.
 * @throws Error if IONOS_API_KEY is not set
 */
export function loadConfig(): IonosConfig {
  // Support both IONOS_API_KEY (combined) and IONOS_API_PREFIX + IONOS_API_SECRET (separate)
  let apiKey = process.env.IONOS_API_KEY;

  if (!apiKey) {
    const prefix = process.env.IONOS_API_PREFIX;
    const secret = process.env.IONOS_API_SECRET;

    if (prefix && secret) {
      apiKey = `${prefix}.${secret}`;
    }
  }

  if (!apiKey || apiKey === '') {
    throw new Error(
      'IONOS API credentials not set.\n' +
        'Set IONOS_API_PREFIX + IONOS_API_SECRET, or IONOS_API_KEY (prefix.secret)\n' +
        'Get your key at https://developer.hosting.ionos.de/keys'
    );
  }

  return {
    apiKey,
    dnsBaseUrl: 'https://api.hosting.ionos.com/dns/v1',
    domainsBaseUrl: 'https://api.hosting.ionos.com/domains/v1',
    maxRetries: 3,
    retryDelayMs: 1000,
    timeoutMs: 30000,
    defaultPageSize: 100,
  };
}

let _config: IonosConfig | undefined;

/**
 * Lazy singleton config instance.
 * Only loads (and validates IONOS_API_KEY) on first access.
 */
export function getConfig(): IonosConfig {
  if (!_config) {
    _config = loadConfig();
  }
  return _config;
}
