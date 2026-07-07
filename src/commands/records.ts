import { Command } from 'commander';
import { DnsService } from '../services/dns';
import type { RecordInput, RecordUpdateInput, DnsRecordType } from '../types/dns';

export function registerRecordCommands(program: Command): void {
  const records = program.command('records').description('DNS record management');

  records
    .command('get <zoneId> <recordId>')
    .description('Get a single DNS record')
    .action(async (zoneId: string, recordId: string) => {
      const dns = new DnsService();
      const record = await dns.getRecord(zoneId, recordId);
      if (process.stdout.isTTY) {
        console.log(`${record.type} ${record.name} → ${record.content}  ttl=${record.ttl}  id=${record.id}`);
      } else {
        console.log(JSON.stringify(record, null, 2));
      }
    });

  records
    .command('create <zoneId>')
    .description('Create DNS record(s) in a zone')
    .requiredOption('-n, --name <name>', 'Record name (e.g., www, @, _acme-challenge)')
    .requiredOption('-t, --type <type>', 'Record type (A, AAAA, CNAME, MX, TXT, ...)')
    .requiredOption('-c, --content <content>', 'Record content/value')
    .option('--ttl <seconds>', 'TTL in seconds (min 60)', '3600')
    .option('--prio <n>', 'Priority (for MX, SRV)')
    .option('--disabled', 'Create as disabled')
    .action(async (zoneId: string, opts) => {
      const dns = new DnsService();
      const input: RecordInput = {
        name: opts.name,
        type: opts.type as DnsRecordType,
        content: opts.content,
        ttl: parseInt(opts.ttl),
        prio: opts.prio ? parseInt(opts.prio) : undefined,
        disabled: opts.disabled ?? false,
      };
      const created = await dns.createRecords(zoneId, [input]);
      if (process.stdout.isTTY) {
        for (const r of created) {
          console.log(`Created: ${r.type} ${r.name} → ${r.content}  (${r.id})`);
        }
      } else {
        console.log(JSON.stringify(created, null, 2));
      }
    });

  records
    .command('update <zoneId> <recordId>')
    .description('Update a DNS record')
    .requiredOption('-c, --content <content>', 'New content/value')
    .option('--ttl <seconds>', 'New TTL', '3600')
    .option('--prio <n>', 'New priority')
    .option('--disabled', 'Disable the record')
    .option('--enabled', 'Enable the record')
    .action(async (zoneId: string, recordId: string, opts) => {
      const dns = new DnsService();
      const update: RecordUpdateInput = {
        content: opts.content,
        ttl: parseInt(opts.ttl),
        prio: opts.prio ? parseInt(opts.prio) : undefined,
        disabled: opts.disabled ? true : opts.enabled ? false : undefined,
      };
      const updated = await dns.updateRecord(zoneId, recordId, update);
      if (process.stdout.isTTY) {
        console.log(`Updated: ${updated.type} ${updated.name} → ${updated.content}  (${updated.id})`);
      } else {
        console.log(JSON.stringify(updated, null, 2));
      }
    });

  records
    .command('delete <zoneId> <recordId>')
    .description('Delete a DNS record')
    .action(async (zoneId: string, recordId: string) => {
      const dns = new DnsService();
      await dns.deleteRecord(zoneId, recordId);
      console.log(`Deleted record ${recordId} from zone ${zoneId}`);
    });
}
