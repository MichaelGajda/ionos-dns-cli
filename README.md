<h3 align="center">ionos-dns-cli</h3>

<div align="center">

[![Status](https://img.shields.io/badge/status-active-success.svg)]()
[![GitHub Issues](https://img.shields.io/github/issues/MichaelGajda/ionos-dns-cli.svg)](https://github.com/MichaelGajda/ionos-dns-cli/issues)
[![GitHub Pull Requests](https://img.shields.io/github/issues-pr/MichaelGajda/ionos-dns-cli.svg)](https://github.com/MichaelGajda/ionos-dns-cli/pulls)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](/LICENSE)

</div>

---

<p align="center">A typed command-line client for the IONOS Hosting API — DNS zones, records, and domains, from your terminal or your scripts.
    <br>
</p>

## Table of Contents

- [About](#about)
- [Getting Started](#getting-started)
- [Usage](#usage)
- [Use as a Library](#use-as-a-library)
- [Running the Tests](#running-the-tests)
- [Built Using](#built-using)
- [Roadmap](ROADMAP.md)
- [Authors](#authors)

## About

> **Unofficial** — a third-party client, not affiliated with or endorsed by IONOS.
> Talks to the public [IONOS Developer / Hosting API](https://developer.hosting.ionos.de/)
> (DNS, records, domains). For IONOS **Cloud** infrastructure, use the official `ionosctl`.

The IONOS web console is fine until you want to script it. `ionos-dns-cli` puts
zones, records, and domains one command away — and validates every response
against Zod schemas derived from the published IONOS OpenAPI spec, so the tool
fails loudly on a surprise instead of handing you garbage.

It is **TTY-aware**: run it in a terminal and you get readable columns; pipe it
and you get JSON, ready for `jq`. Same command, right output for the job.

## Getting Started

### Prerequisites

- Node.js ≥ 18 (uses the built-in `fetch`)
- An IONOS API key — create one at <https://developer.hosting.ionos.de/keys>
  (it comes as a `prefix.secret` pair)

### Installing

```bash
git clone https://github.com/MichaelGajda/ionos-dns-cli.git
cd ionos-dns-cli
npm install
npm run build
npm link        # optional: puts `ionos` on your PATH
```

Without `npm link`, run it as `node dist/cli.js <command>`.

### Authenticate

Provide your key as environment variables — separately (preferred) or combined:

```bash
export IONOS_API_PREFIX=your-prefix
export IONOS_API_SECRET=your-secret
# or:
export IONOS_API_KEY=your-prefix.your-secret
```

Prefer a file? Keep them in `.env` (see `.env.example`) and use Node's native flag:

```bash
node --env-file=.env dist/cli.js zones list
```

### Verify

```bash
ionos --version
ionos zones list
```

## Usage

```bash
# DNS zones
ionos zones list                          # all zones
ionos zones find example.com              # look up a zone by domain
ionos zones get <zoneId>                  # zone details incl. records
ionos zones get <zoneId> --type A,MX      # filter records by type

# DNS records
ionos records get    <zoneId> <recordId>
ionos records create <zoneId> --help      # A/AAAA/CNAME/MX/TXT/... records
ionos records update <zoneId> <recordId> --ttl 3600
ionos records delete <zoneId> <recordId>

# Domains
ionos domains list
ionos domains get <domainId>
ionos domains nameservers <domainId>
ionos domains contacts <domainId>
ionos domains tlds                        # supported TLDs
ionos domains tld-info <tld>              # capabilities of one TLD
ionos domains transfers                   # running transfers
ionos domains explore <path>              # raw API path, for discovery
```

Run any command with `--help` for its options.

**In a terminal** (`zones list`):

```
Found 3 zone(s):

  example.com                         a1b2c3d4-e5f6-7890-abcd-ef0123456789  [NATIVE]
  example.org                         b2c3d4e5-f6a7-8901-bcde-f01234567890  [NATIVE]
  example.net                         c3d4e5f6-a7b8-9012-cdef-012345678901  [NATIVE]
```

**Zone with records** (`zones get <zoneId>`):

```
Zone: example.com  (a1b2c3d4-...)  [NATIVE]
Records (4):

  A            www.example.com                     93.184.216.34  ttl=3600
  AAAA         www.example.com                     2606:2800:220:1:248:1893:25c8:1946  ttl=3600
  MX           example.com                         mail.example.com  ttl=3600 prio=10
  TXT          example.com                         "v=spf1 include:_spf.example.com ~all"  ttl=3600
```

**Piped** — same command, JSON out, straight into `jq`:

```bash
ionos zones list | jq '.[] | select(.type == "NATIVE") | .name'
ionos zones get <zoneId> | jq '.records[] | select(.type == "MX")'
```

## Use as a Library

Every command is a thin wrapper over a service you can import directly:

```ts
import { DnsService } from 'ionos-dns-cli';

const dns = new DnsService();            // reads IONOS_API_* from the environment
const zones = await dns.listZones();
const zone = await dns.getZone(zones[0].id);
```

Exports: `DnsService`, `DomainsService`, `IonosHttpClient`, `loadConfig`, and the
error types (`IonosError`, `NetworkError`, `RateLimitError`, `ValidationError`).

## Running the Tests

```bash
npm run type-check    # tsc --noEmit
npm test              # vitest
```

## Built Using

- [TypeScript](https://www.typescriptlang.org/) — typed end to end
- [commander](https://github.com/tj/commander.js) — command parsing
- [zod](https://zod.dev/) — response validation against the IONOS OpenAPI spec
- [vitest](https://vitest.dev/) — tests
- Node's built-in `fetch` — no HTTP dependency

The IONOS API is rate-limited (~1200 requests/hour); the client retries with
backoff and surfaces a clear message when the limit is hit.

## Authors

- [@MichaelGajda](https://github.com/MichaelGajda) — Creator
- [Claude](https://claude.ai) — Rubber duck that talks back
