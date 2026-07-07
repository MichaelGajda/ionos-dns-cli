import { Command } from 'commander';
import { DomainsService } from '../services/domains';

export function registerDomainCommands(program: Command): void {
  const domains = program.command('domains').description('Domain management');

  domains
    .command('list')
    .description('List all domains')
    .option('-l, --limit <n>', 'Max results', '100')
    .option('-o, --offset <n>', 'Offset', '0')
    .option('--tld <tld>', 'Filter by TLD')
    .option('--name <name>', 'Search by name (min 3 chars)')
    .option('--status', 'Include domain status details')
    .action(async (opts) => {
      const svc = new DomainsService();
      const result = await svc.listDomains({
        limit: parseInt(opts.limit),
        offset: parseInt(opts.offset),
        tld: opts.tld,
        name: opts.name,
        includeDomainStatus: opts.status ?? false,
      });
      if (process.stdout.isTTY) {
        console.log(`Found ${result.count} domain(s):\n`);
        for (const d of result.domains) {
          const prov = d.pendingProvisioning ? ' [PENDING]' : '';
          console.log(`  ${d.name.padEnd(35)} ${d.id}  [${d.tld}]${prov}`);
        }
      } else {
        console.log(JSON.stringify(result, null, 2));
      }
    });

  domains
    .command('get <domainId>')
    .description('Get domain details')
    .option('--status', 'Include full status details')
    .action(async (domainId: string, opts) => {
      const svc = new DomainsService();
      const domain = await svc.getDomain(domainId, opts.status ?? false);
      if (process.stdout.isTTY) {
        console.log(`Domain:       ${domain.name}`);
        console.log(`ID:           ${domain.id}`);
        console.log(`Type:         ${domain.domainType}`);
        console.log(`TLD:          ${domain.tld}`);
        console.log(`Expires:      ${domain.expirationDate}`);
        console.log(`Auto-renew:   ${domain.autoRenew}`);
        console.log(`Privacy:      ${domain.privacyEnabled}`);
        console.log(`Transfer lock:${domain.transferLock}`);
        console.log(`DNSSEC:       ${domain.dnsSecEnabled}`);
      } else {
        console.log(JSON.stringify(domain, null, 2));
      }
    });

  domains
    .command('nameservers <domainId>')
    .description('Show nameserver config')
    .action(async (domainId: string) => {
      const svc = new DomainsService();
      const ns = await svc.getNameservers(domainId);
      if (process.stdout.isTTY) {
        console.log(`Type: ${ns.type}\n`);
        for (const n of ns.nameservers) {
          const ipv4 = n.ipV4Addresses?.join(', ') || '';
          console.log(`  ${n.name}  ${ipv4}`);
        }
      } else {
        console.log(JSON.stringify(ns, null, 2));
      }
    });

  domains
    .command('contacts <domainId>')
    .description('Show domain contacts')
    .option('--registry', 'Show registry contacts instead of local')
    .action(async (domainId: string, opts) => {
      const svc = new DomainsService();
      const contacts = opts.registry
        ? await svc.getRegistryContacts(domainId)
        : await svc.getContacts(domainId);
      console.log(JSON.stringify(contacts, null, 2));
    });

  domains
    .command('tlds')
    .description('List supported TLDs')
    .action(async () => {
      const svc = new DomainsService();
      const tlds = await svc.listTlds();
      if (process.stdout.isTTY) {
        console.log(`${tlds.length} supported TLD(s):\n`);
        console.log(tlds.join(', '));
      } else {
        console.log(JSON.stringify(tlds, null, 2));
      }
    });

  domains
    .command('tld-info <tld>')
    .description('Get TLD capabilities')
    .action(async (tld: string) => {
      const svc = new DomainsService();
      const info = await svc.getTldInfo(tld);
      console.log(JSON.stringify(info, null, 2));
    });

  domains
    .command('transfers')
    .description('Show running transfers')
    .action(async () => {
      const svc = new DomainsService();
      const transfers = await svc.getRunningTransfers();
      if (process.stdout.isTTY) {
        if (transfers.length === 0) {
          console.log('No running transfers.');
        } else {
          for (const t of transfers) {
            console.log(`  ${t.domainName}  ${t.transferType}  ${t.transferStatus}`);
          }
        }
      } else {
        console.log(JSON.stringify(transfers, null, 2));
      }
    });

  domains
    .command('request <requestId>')
    .description('Check update request status')
    .action(async (requestId: string) => {
      const svc = new DomainsService();
      const req = await svc.getRequest(requestId);
      if (process.stdout.isTTY) {
        console.log(`Request: ${req.id}`);
        console.log(`Status:  ${req.status}`);
        console.log(`Type:    ${req.type}`);
        if (req.details) console.log(`Details: ${req.details}`);
        if (req.errors) console.log(`Errors:  ${req.errors}`);
      } else {
        console.log(JSON.stringify(req, null, 2));
      }
    });

  domains
    .command('explore <path>')
    .description('Explore a raw API path (for discovery)')
    .action(async (path: string) => {
      const svc = new DomainsService();
      const data = await svc.explore(path);
      console.log(JSON.stringify(data, null, 2));
    });
}
