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

Shared foundation: `d2cbd5a`. Last verified build before this scope expansion: **7.0.220**. The first nine migrations included some correctness fixes before the latest scope clarification; do not use those as a reason to expand later migrations into new checks.

Current primary-agent reviewed migration: `discover:headline-length`. Lower-cost agents are preparing isolated patches for `discover:published-time`, `discover:author-present` and `discover:headline-length`; see agent messages and `/tmp/*-migration.patch`. Continue through every remaining existing registry rule.

## Shared follow-up work still required

- Wire presentation lint into `npm run lint`; its script exists and has passed against the first eight migrated rules.
- Add headless coverage of the actual new extension cards (not only the standalone dummy), all actions, references, original data and the not-applicable filter.
- Ensure lifecycle-unavailable results use the new presentation, alongside pending/disabled/runtime errors.
- Improve large-payload retention by keeping whole evidence records where possible, always reporting omissions and never truncating attested originals.
- Verify search, filter persistence and CLI HTML exports for new presentations. Keep status labels readable in copied results.
- Include the vendored Lucide ISC notice in built distribution assets.
- Update the dummy's preview-permission input label to match the actual Static DOM + response headers context.

The current `SPEC.md` and `LINTING.md` are the detailed contract. `index.html` is the approved interactive dummy. Temporary verification helper `/tmp/verify-rule-ux.py` archives old build outputs, runs all gates and commits explicit paths; its source is short and should be inspected before reuse. Do not run old bulk-migration scripts in `/tmp/`.
