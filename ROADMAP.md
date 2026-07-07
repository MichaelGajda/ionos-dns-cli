# Roadmap

Versioning follows [semver](https://semver.org/). While on `0.x` the surface may
still change. **1.0 is a stability promise**, not a feature count: at 1.0 the
command surface, the piped-JSON output, and the library exports become a
contract — breaking changes require a major bump.

## v0.2.0 — current

- CLI `ionosdns`: DNS **zones** (list / get / find), **records** (full CRUD), **domains** (read + `explore`)
- **MCP server** `ionosdns-mcp` — the same capabilities as MCP tools over stdio (11 tools)
- Importable TypeScript library (`DnsService`, `DomainsService`, `IonosHttpClient`, …)
- Zod-validated responses, TTY-aware output (columns in a terminal, JSON when piped)
- 46 unit tests (config, schemas, errors, HTTP client, DNS + domains services)
- CI on Node 18 / 20 / 22

## Shipped early

The MCP server was planned for v1.1 but landed in v0.2.0 — the core is
transport-agnostic, so it was a purely additive second adapter over the same
services (existing Zod schemas doubled as the tool input schemas).

- [x] `src/mcp.ts` entrypoint using `@modelcontextprotocol/sdk`
- [x] Services exposed as MCP tools; read tools flagged read-only, deletes destructive
- [x] Second bin `ionosdns-mcp` (same `IONOS_API_*` auth as the CLI)

## Toward v1.0 — "stable contract"

The gap from `0.x` to `1.0` is trust, not features:

- [x] **Service + HTTP-client tests** against mocked responses — retry, rate-limit, error paths
- [x] **CI** — GitHub Actions: build + type-check + test on every push/PR
- [x] `CHANGELOG.md`
- [ ] **Publish to npm** so `npm i -g ionos-dns-cli` works (currently install-from-source)
- [ ] Freeze command/flag names + the MCP tool set; document the JSON output shape as a versioned contract
- [ ] Decide the domains scope: stay DNS-focused (read-only domains) or add full domain management
- [ ] (nice-to-have) zone **import/export** via zonefile

## Beyond

Maintained as standing infrastructure. Issues and PRs welcome.
