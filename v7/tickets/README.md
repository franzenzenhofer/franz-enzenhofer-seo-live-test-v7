# Open work - the single index

This file is the one place that lists what is still open. Detailed specs live in the linked files.

## Structure
- `closed/` - completed tickets, for reference
- `research/` - research documents
- `*.md` in this folder - specs for open or future work (listed below)
- `../opentickets/` - the rule-coverage backlog, rounds 2 to 9

## Open, most valuable first
1. **Round-9 spec coverage backlog** - `../opentickets/round-9-spec-coverage/tickets.md`, TCK-901 to TCK-1035
   (135 tickets, not started). TCK-1035 (fold `schema:article:present` into
   `discover:article-structured-data`) is already approved.
2. **Deliberately deferred engine work** - `../docs/implementation-handoff.md`, section "Still open, deliberately":
   image-dimension heuristics, shared script classification, Article date/entity validation, the local
   heading/link/meta-refresh/base/language checks, and the optional, disabled-by-default deeper URL checks
   (canonical destination health, hostname/protocol variants, cached sitemap inspection - spec in
   `sitemap-fetch-spec.md`).
3. **OAuth client swap** - `oauth-unverified-app-gsc.md`: the OAuth client still lives in a former contractor's
   Cloud project. A replacement in `seo-extension-1763158338633` is ready; enable the Search Console API there
   before swapping `OAUTH_CLIENT_ID`. Cost: every user grants consent once more.
4. **AI robots.txt integration** - `ai-robots-txt-integration.md`, a future feature, not implemented.
5. **Residual risks of the 2026-05-20 hardening audit** - `../AUDIT-REPORT.md`, "Residual risks / follow-ups":
   headless extension-ID fallback in the heap audit, the on-demand `getFullHtml` message (no longer present in
   `src/`), Zod on storage reads (deferred), no Sentry (by choice), `webRequest` to `declarativeNetRequest` (P3).
6. **Rounds 2 to 8** in `../opentickets/` carry no status markers. The one spot check (TCK-001) was already done,
   so verify each ticket against the code before starting it.

## Done recently
- 2026-09-10: the extension never audits CMS back offices or action URLs and never requests back-office, action
  or token URLs; every probe is anonymous (`credentials: 'omit'`). Trigger: a WordPress agency's report that
  the link checker executed trash and logout links. See `../RUNBOOK.md`, "Add a new fetch".
- 2026-09-10: the repository was reduced to one branch (`main`); every head that was not merged was verified as
  superseded and kept as an `archive/*` tag.

---
Last updated: 2026-09-10
