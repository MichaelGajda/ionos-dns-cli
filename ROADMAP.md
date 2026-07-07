# Roadmap

Versioning follows [semver](https://semver.org/). While on `0.x` the surface may
still change. **1.0 is a stability promise**, not a feature count: at 1.0 the
command surface, the piped-JSON output, and the library exports become a
contract — breaking changes require a major bump.

## v0.1.x — current

- CLI: DNS **zones** (list / get / find), **records** (full CRUD), **domains** (read + `explore`)
- Importable TypeScript library (`DnsService`, `DomainsService`, `IonosHttpClient`, …)
- Zod-validated responses, TTY-aware output (columns in a terminal, JSON when piped)
- Unit tests: config, schemas, errors (19)

## Toward v1.0 — "stable contract"

The gap from `0.x` to `1.0` is trust, not features:

- [ ] **Service + HTTP-client tests** against mocked responses — retry, pagination, rate-limit, error paths (the real risk core)
- [ ] **CI** — GitHub Actions: build + type-check + test on every push/PR
- [ ] **Publish to npm** so `npm i -g ionos-dns-cli` works (currently install-from-source)
- [ ] Freeze command/flag names; document the JSON output shape as a versioned contract
- [ ] `CHANGELOG.md`
- [ ] Decide the domains scope: stay DNS-focused (read-only domains) or add full domain management
- [ ] (nice-to-have) zone **import/export** via zonefile

## v1.1 — MCP server (additive, non-breaking)

The core is transport-agnostic, so this is a second adapter over the same
services — no change to the CLI:

- [ ] `src/mcp.ts` entrypoint using `@modelcontextprotocol/sdk`
- [ ] Expose the services as MCP **tools**, reusing the existing Zod schemas as tool input schemas
- [ ] Second bin `ionos-dns-mcp` in this package (same `IONOS_API_*` auth as the CLI)

## Beyond

Maintained as standing infrastructure. Issues and PRs welcome.
