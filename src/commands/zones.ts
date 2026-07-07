import { Command } from 'commander';
import { DnsService } from '../services/dns';

export function registerZoneCommands(program: Command): void {
  const zones = program.command('zones').description('DNS zone management');

  zones
    .command('list')
    .description('List all DNS zones')
    .action(async () => {
      const dns = new DnsService();
      const zones = await dns.listZones();
      if (process.stdout.isTTY) {
        console.log(`Found ${zones.length} zone(s):\n`);
        for (const z of zones) {
          console.log(`  ${z.name.padEnd(35)} ${z.id}  [${z.type}]`);
        }
      } else {
        console.log(JSON.stringify(zones, null, 2));
      }
    });

  zones
    .command('get <zoneId>')
    .description('Get zone details with records')
    .option('--name <name>', 'Filter records by name')
    .option('--type <type>', 'Filter records by type (comma-separated: A,AAAA,MX,...)')
    .option('--suffix <suffix>', 'Filter by FQDN suffix')
    .action(async (zoneId: string, opts) => {
      const dns = new DnsService();
      const zone = await dns.getZone(zoneId, {
        recordName: opts.name,
        recordType: opts.type,
        suffix: opts.suffix,
      });
      if (process.stdout.isTTY) {
        console.log(`Zone: ${zone.name}  (${zone.id})  [${zone.type}]`);
        console.log(`Records (${zone.records.length}):\n`);
        for (const r of zone.records) {
          const prio = r.prio ? ` prio=${r.prio}` : '';
          const disabled = r.disabled ? ' [DISABLED]' : '';
          console.log(`  ${r.type.padEnd(12)} ${r.name.padEnd(35)} ${r.content}  ttl=${r.ttl}${prio}${disabled}`);
        }
      } else {
        console.log(JSON.stringify(zone, null, 2));
      }
    });

  zones
    .command('find <name>')
    .description('Find a zone by domain name')
    .action(async (name: string) => {
      const dns = new DnsService();
      const zone = await dns.findZoneByName(name);
      if (!zone) {
        console.error(`Zone not found: ${name}`);
        process.exit(1);
      }
      if (process.stdout.isTTY) {
        console.log(`${zone.name.padEnd(35)} ${zone.id}  [${zone.type}]`);
      } else {
        console.log(JSON.stringify(zone, null, 2));
      }
    });
}
