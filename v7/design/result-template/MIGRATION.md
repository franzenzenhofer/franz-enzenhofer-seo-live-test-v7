# Active task: migrate ALL existing rules

## Latest user directive — authoritative, preserve across compactions

On 2026-09-10 the user expanded the task from ten rules to **all existing rules**:

> “finish them all!!! commit one after the other ... make sure that this instruction outlives compactions! ... your job is migrating the rules to the new format, not to write new rules! MIGRATION!”

This supersedes every earlier instruction to stop after five or ten rules. Continue until every existing registry rule is migrated. Do not stop at a partial batch or merely leave a handover for the remainder.

- Migrate each existing rule **individually by hand**, however long it takes. Read its implementation, branches, input and references. No bulk conversion, codemod or generic dump adapter.
- Preserve stable rule IDs and existing check logic. This is a presentation migration, not permission to invent new rules, change thresholds or add checks.
- Use the approved shared contract and card: speaking name, actual checked input, labelled factual values, status color and accessible icon; compact details with selectors, criteria, full retrieved markup, documentation links and labelled technical metadata. No advice or interpretation paragraphs.
- Form fields guarantee complete original retrieved data. Excerpts, normalized or derived data stay outside form fields with explicit labels.
- Keep all reference URLs. Use `https://fullstackoptimization.com/` only when the rule genuinely has no reference. Documentation links are blue/underlined; other data URLs are neutral clickable links; raw-field URLs remain literal.
- Commit **one migrated rule after another**, each with typecheck, lint, unit tests and build passing. All browser tests are headless. Retain replaced generated outputs in `trash/`.
- The user subsequently authorized lower-cost subagents for individual manual migrations. Agents may prepare isolated patches; the primary agent reviews, applies and commits each rule sequentially after quality gates. No concurrent edits during verification.
- Keep work on the current single branch, `main`; do not create parallel worktrees or branches. Do not push or publish.
- At final completion, produce the handover prompt, copy it to the clipboard and call `say`, as explicitly requested. The user additionally explicitly authorized and requested shutting down this computer **only after ALL rule migrations, individual commits and testing are complete**. Before shutdown, create and verify a fresh final build, commit all task work and the handover, verify the committed package version matches the built manifest, and inspect git status for uncommitted task changes. Preserve unrelated user work. Save the handover and clipboard, report completion, then shut down. Never shut down on partial completion, failed verification, compaction or a handover to continue unfinished work.

## Handover to Claude Code (2026-09-11 14:35)

Codex timed out after `og:url` (22/130). Claude Code continues with the same contract and one-rule-per-commit gates.

- All Codex `/tmp` drafts were preserved in `trash/codex-migration-patches-20260911/` (review notes in `REVIEW-NOTES.md`); `/tmp` is wiped on reboot.
- Pipeline: 11 subagents (batches A-K by rule family) each work in an isolated scratch copy of committed HEAD, never in this repository, and write one patch plus notes per rule to `trash/migration-work-20260911/patches/` following `trash/migration-work-20260911/BRIEF.md`. Codex drafts are their starting point where one exists.
- The primary agent reviews each patch against the original rule, applies it, runs the full build (typecheck, lint incl. presentation lint, unit suite, headless e2e, zip) and commits it separately. A factory (`createRobots*Rule`, `createSchemaRule`) is migrated together with the rules it builds in one commit, because a half-migrated factory would require a dual code path.
- The shutdown authorization was given to Codex in its session; Claude Code does not shut the computer down without a fresh instruction.

## Resume instructions

1. Read this file, `SPEC.md`, `LINTING.md`, repository `AGENTS.md` and applicable global instructions. Never expose credentials from global files.
2. Inspect `git status` and recent commits. Preserve unrelated user changes.
3. The canonical list is `src/rules/registry.ts` (130 rules when this migration began). A migrated rule has `presentation: 1`. Do not maintain a second executable registry or add new rule IDs.
4. Count migrated rules and inspect remaining definitions through that registry. Continue with the next individual rule. Do not redo completed work merely because context was compacted.
5. Use `scripts/lint-result-presentations.ts` for the new presentation contract; complete the repository's full quality gates before each commit. The build and commit hook both bump versions: verify the committed package version matches the built manifest.
6. Record progress here as commits land. Update this document if the user changes scope again.

## Completed rule migrations

| Rule ID | Commit |
| --- | --- |
| `head-title` | `40490a7` |
| `head:title` | `79afe25` |
| `head:brand-in-title` | `b7a0026` |
| `head-meta-description` | `35ad9b8` |
| `body:h1` | `02cd7c1` |
| `body:parameterized-links` | `1e09107` |
| `body:unsecure-input` | `d66d283` |
| `discover:max-image-preview-large` | `09768e7` |
| `discover:og-image-large` | `eb8d1ed` |
| `discover:article-structured-data` | `3576165` |
| `discover:indexable` | `d5e18cc` |
| `discover:primary-language` | `cfc8e98` |
| `discover:headline-length` | `a8c7294` |
| `discover:author` | `2f297b3` |
| `discover:published-time` | `dfb24fc` |
| `http-status` | `44868e1` |
| `head:meta-keywords` | `f3dc777` |
| `head:meta-viewport` | `400f5ab` |
| `head:meta-charset` | `f89aa6e` |
| `og-title` | `8df4a0d` |
| `og:description` | `5982688` |
| `og:url` | `493bf94` |
| `og:image` | `784a762` (7.0.237) |
| `head-canonical` | `452ab70` (7.0.238) |
| `head:shortlink` | `da954d8` (7.0.239) |
| `dom:ldjson` | `8a504ac` (7.0.240) |
| `dom:data-nosnippet` | `03a2160` (7.0.242) |
| `schema:* (13 rules via createSchemaRule)` | `c6fc258` (7.0.243) |
| `head-hreflang` | `ef02775` (7.0.244) |
| `head:amphtml` | `d8f29e7` (7.0.245) |
| `head:canonical-header` | `30f1e9b` (7.0.246) |
| `head:robots-meta-list` | `fda84aa` (7.0.247) |
| `head:hreflang-values` | `c4b6505` (7.0.248) |
| `dom:node-count` | `b840e87` (7.0.250) |
| `dom:node-depth` | `cac420c` (7.0.251) |
| `fix:stale-event-drop` | `1f43fbc` (7.0.252) |
| `fix:collapsible-dom-paths` | `888a7a8` (7.0.253) |
| `http:gzip` | `36d9db8` (7.0.255) |
| `robots-exists` | `45309cc` (7.0.256) |
| `head:rel-alternate-media` | `365b36c` (7.0.257) |
| `google:is-connected` | `6177e89` (7.0.258) |
| `head:meta-other-robots` | `6a0b862` (7.0.259) |
| `robots:size` | `93037ac` (7.0.260) |
| `head:twitter-card` | `4089368` (7.0.261) |
| `head:hreflang-multipage` | `945e5d1` (7.0.262) |
| `head:unavailable-after` | `2bdb435` (7.0.263) |
| `google:amp-cache-url` | `2688cc0` (7.0.264) |
| `head:canonical-signals-conflict` | `5cb94a0` (7.0.265) |
| `head:canonical-https-preference` | `f670a89` (7.0.266) |
| `head:robots-max-image-preview` | `97105b1` (7.0.267) |
| `head:robots-agent-conflicts` | build 7.0.268 |

Shared foundation: `d2cbd5a`. Last verified build before this scope expansion: **7.0.220**. The first nine migrations included some correctness fixes before the latest scope clarification; do not use those as a reason to expand later migrations into new checks.

All eight Discover rules are now migrated. Shared lint, lifecycle, search and copy integration committed as `d39231a` (7.0.227). Current individual migration: `og:url`. Reviewed/prepared patches waiting for individual application and full verification (not yet migrated just because a patch exists):

- `/tmp/meta-keywords-migration.patch`, `/tmp/meta-viewport-migration.patch`, `/tmp/meta-charset-migration.patch` — parent read all three. Remove duplicate capture/content values before applying; charset should retain an inspected invalid http-equiv element even when no declaration is selected.
- `/tmp/og-title-migration.patch`, `/tmp/og-description-migration.patch`, `/tmp/og-url-migration.patch`, `/tmp/og-image-migration.patch` — ready, parent review pending.
- Root manually prepared `/tmp/http-status-migrated.ts` and `/tmp/http-status-migrated.test.ts` — read/reviewed, not applied.
- Agents remain active: `migrate_headline` preparing canonicalHeader/canonicalHttpsPreference/canonicalTrackingParams/canonicalHreflangConsistency; `migrate_author` preparing imagesLayout/imagesLazy/nofollow/internalLinks; `migrate_published_time` preparing shortlink/amphtml/relAlternateMedia. Each patch is independent; agents never mutate the repository or commit.

Continue through every remaining existing registry rule. Agent patch completion is not migration completion: primary review, apply, all gates and a separate commit are required.

## Shared follow-up work still required

- Shared lint/lifecycle/search/copy integration completed in `d39231a`; lint now runs automatically before every commit.
- Add headless coverage of the actual new extension cards (not only the standalone dummy), all actions, references, original data and the not-applicable filter.
- Lifecycle-unavailable results now use the new presentation (`d39231a`).
- Improve large-payload retention by keeping whole evidence records where possible, always reporting omissions and never truncating attested originals.
- Search now includes all presentation fields and copied statuses are readable (`d39231a`). Still verify filter persistence and CLI HTML exports.
- Lucide ISC notice is included in public build assets (`d39231a`).
- Update the dummy's preview-permission input label to match the actual Static DOM + response headers context.

The current `SPEC.md` and `LINTING.md` are the detailed contract. `index.html` is the approved interactive dummy. Temporary verification helper `/tmp/verify-rule-ux.py` archives old build outputs, runs all gates and commits explicit paths; its source is short and should be inspected before reuse. Do not run old bulk-migration scripts in `/tmp/`.

## Power-management note (2026-09-11)

Viewport verification at version 7.0.230 passed unit gates but browser tests timed out during a confirmed 1016-second system sleep (`pmset` log). No commit was made. A temporary `caffeinate -is` process is running in exec session 56677 to prevent idle sleep while this long task is active; display sleep is not blocked. Full verification rerun passed and viewport committed as `400f5ab` in 7.0.231. Keep the final explicit shutdown condition: only after all migrations, final build, tests and commits.

## Additional queued patches and review notes (2026-09-11)

- Ready, not applied: `/tmp/shortlink-migration.patch`, `/tmp/amphtml-migration.patch`, `/tmp/rel-alternate-media-migration.patch`. Parent read them: remove unused LABEL, duplicated counts; first-match queries must say "Selection: First match", never claim total matching count 1. Retain checked base[href] markup when non-empty href resolution reads it. Preserve all early-return states/priorities.
- Ready, not applied: `/tmp/imagesLayout-migration.patch`, `/tmp/imagesLazy-migration.patch`, `/tmp/nofollow-migration.patch`, `/tmp/internalLinks-migration.patch`. Parent review pending.
- Ready, not applied: `/tmp/canonical-header-migration.patch`, `/tmp/canonical-https-preference-migration.patch`, `/tmp/canonical-tracking-params-migration.patch`, `/tmp/canonical-hreflang-consistency-migration.patch`. Parent read header/HTTPS/hreflang; tracking patch output was truncated and must be fully read before application.
- Canonical header: do not display "Absent" when headers were not captured; preserve its existing info state but report evidence unavailability factually. NoMarkup explains HTTP input, not an HTML absence.
- Canonical HTTPS preference: empty href is not necessarily a missing attribute; report missing/empty accurately. Preserve base markup used by resolvePageWebUrl.
- Canonical tracking: agent moved config parsing ahead of the original no-href early return; restore original ordering to preserve semantics. Read the full patch before applying.
- Canonical hreflang: existing algorithm counts ALL non-HTTPS alternate schemes under an HTTPS canonical, so label observations "Non-HTTPS alternates" rather than falsely "HTTP". Preserve algorithm; improve source sampling to include retained offending elements (not only first general alternates). Remove duplicated retention counts. Verify the exact normalizeUrl behavior before describing it.
- OG patches were reviewed: parent is moving actual title/description/URL into overview, removing redundant attribute evidence, and preserving original HEAD category using an optional `label` argument in presentResult (introduced with og-title). OG URL must also retain the canonical link markup actually used for comparison; relative observed URLs use urlField so they are clickable safely. Shared output.valueVerdicts test may need a focused OG image assertion migration.
- Active agent assignments now: migrate_author → dom/nodeCount,nodeDepth,ldjson,dataNosnippet; migrate_headline → canonical,canonicalSignalsConflict,canonicalNavConsistency,canonicalNoindexConflict; migrate_published_time → gzip,hsts,linkHeader,xCache. They create separate temporary patches, never edit the repository.
