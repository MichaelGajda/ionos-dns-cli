#!/usr/bin/env node
import { Command } from 'commander';
import { registerZoneCommands } from './commands/zones';
import { registerRecordCommands } from './commands/records';
import { registerDomainCommands } from './commands/domains';
import { IonosError, NetworkError, RateLimitError } from './errors';
import { VERSION } from './version';

const program = new Command();

program
  .name('ionosdns')
  .description('IONOS Hosting API CLI — DNS zones, records, and domains')
  .version(VERSION);

registerZoneCommands(program);
registerRecordCommands(program);
registerDomainCommands(program);

program.parseAsync(process.argv).catch((error) => {
  if (error instanceof RateLimitError) {
    console.error('Rate limit exceeded (1200 req/hour). Try again later.');
  } else if (error instanceof NetworkError) {
    console.error(`Network error: ${error.message}`);
  } else if (error instanceof IonosError) {
    console.error(`IONOS API error (${error.statusCode}): ${error.message}`);
    if (error.details) {
      for (const d of error.details) {
        console.error(`  ${d.field}: ${d.message}`);
      }
    }
  } else if (error instanceof Error) {
    console.error(error.message);
  }
  process.exit(1);
});
