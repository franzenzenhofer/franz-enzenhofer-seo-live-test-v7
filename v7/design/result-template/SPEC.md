# Result presentation contract

Audience: SEO professionals inspecting observed site code and responses. This specification incorporates the approved interactive dummy and subsequent corrections. It governs the shared card, report and copy output.

## Purpose and scope

A result answers three questions: what was checked, what values were observed, and whether the stated criterion was met. It does not provide editorial advice or an SEO tutorial. Browser repairs do not make incorrect source code correct: an authored HTTP resource URL remains a finding even if a browser upgrades the request.

Migrate **all existing registry rules**, one rule per commit. The user expanded the scope on 2026-09-10; this supersedes the earlier ten-rule limit. Preserve existing rule IDs and check logic: this is a presentation migration, not the creation of new rules or criteria. Shared infrastructure is a separate logical change. Track progress and resume instructions in `MIGRATION.md`.

Every rule must be reviewed and changed individually by hand, however long it takes. Read its actual implementation, input, criteria, branches, tests and references before editing it. Do not use codemods, bulk substitutions or a generic legacy-dump adapter to claim rules have been migrated. Shared contracts, evidence helpers and the renderer remain reusable; each rule's facts and evidence selection require an individual implementation and review. Commit each completed rule separately after its quality gates pass.

## Overview

Display these in order:

1. Accessible status icon, speaking rule name, optional separate favorite star, Copy, bordered Details button and actions menu.
2. `Checked input:` with the actual input used in this execution. Distinguish Static DOM, Idle DOM, page URL, HTTP response headers, navigation events and combined inputs. Configured input is not proof that it was received or checked.
3. Compact labelled results. A number is always attached to its meaning and unit. Booleans use explicit factual words such as Found / Not found, Present / Absent, or Yes / No. Do not render serialized objects or unlabelled arrays.

Do not repeat a large status sentence such as “Check passed”. Status is communicated through color and a library icon with an accessible name. Include the status as text in copied reports and filter controls.

For a title or heading presence check, the overview may include complete original markup in a readonly field labelled `<title>:` or `<h1>:`. Counts and derived values remain plain text. Long values wrap without making the card wider than its container.

## Expanded details

Expansion preserves the overview and reveals, in this order:

1. Useful extracted values as labelled plain text. A title check includes `Title: [text without tags]` in addition to the full original `<title>` field. Never infer a complete text value from an incomplete capture.
2. What was checked: exact selectors, relevant attributes or headers, crawler, matching operation, applicable condition and criterion/threshold. These are concise labelled facts, not prose paragraphs.
3. Evidence records, individually labelled and attributable: element text or alt text, the element's DOM path, attribute, resource URL, observed status and other relevant facts. Terminology (user decision 2026-09-11): `Selector` always means the CSS selector the rule actually queried and appears under What was checked; the generated location of a found element is always labelled `DOM path`, never `Selector`. HTTP statuses include their standard reason phrase, e.g. `308 Permanent Redirect`.
4. Complete retrieved markup for inspected elements. If already displayed in the overview, do not duplicate the same field. If none was retrieved, state the exact reason: no matching elements, not applicable, not captured, or capture incomplete. HTTP-only checks instead retain original response/header evidence where available; do not invent HTML for them.
5. Documentation references, always present.
6. Compact labelled technical footer: Rule ID, Run position, Sort priority. No unexplained `P700` or `#60` badges, and no extra metadata accordion. Run position identifies this execution's result position; Rule ID is the stable identifier used by settings and code; priority is the sorting value, not a severity score.

No generic dump is an acceptable substitute for curated evidence. Do not hide technically relevant fields merely to make the card shorter. Use compact spacing and coherent grouping instead.

## Original-data field guarantee

A form field is a promise: its value is complete original retrieved data from the named capture boundary. Preserve attributes, nested tags, whitespace, original URL strings and all captured content. The DOM's native serialization is a DOM snapshot, not the original HTTP response bytes; label the checked input accordingly.

Do not use shortened snippets, stripped attributes, generated markup, normalized text, joined/reconstructed element strings or JSON serialization of a result object as original-data fields. Store each captured element separately. Excerpts and derived representations must have explicit labels outside form fields. Complete extracted title text is displayed in the plain-text `Title:` row.

Capture provenance must be explicit. A document reconstructed from compact facts cannot attest that its `outerHTML` is original. It can only pass through an original string retained at the actual capture boundary. Legacy records without provenance do not qualify for an original-data field.

Storage and transport bounds must preserve this guarantee. Remove an entire evidence item or mark an excerpt explicitly when capacity is exceeded; never shorten a value while retaining a complete-original marker. Report exact retained and omitted record counts where known. Missing evidence must not become a false pass.

The renderer escapes all captured data. It never interprets retrieved HTML as executable content. Raw fields remain selectable and readonly; copying a field copies the exact stored value.

## URL and reference rules

All HTTP(S) URLs outside original-data fields are links. Resolve relative page/resource URLs against the tested page's applicable base URL while displaying the observed string. Page/resource links use neutral text styling. Documentation/reference links alone are blue and underlined. Links open safely with `noopener noreferrer`; reject executable schemes. URLs inside raw fields remain literal, non-clickable data.

Every expanded result and copied/exported report includes all the rule's existing reference URLs. If and only if the rule has no reference, use `https://fullstackoptimization.com/`. Invalid references fail configuration validation; do not silently replace an invalid existing reference with the fallback. Do not discard secondary references or shorten the underlying link target.

## Status states and filters

| State | Visual | Meaning |
| --- | --- | --- |
| Passed | Green, circle check | Observed input meets the stated criterion |
| Failed | Red, circle X | Observed input violates the stated error criterion |
| Warning | Amber, triangle alert | Observed input does not meet the rule's warning criterion |
| Information | Blue, info | Observation without a pass/fail verdict |
| Not applicable | Neutral gray, circle minus | An observed prerequisite excludes this check |
| Pending | Inactive, loader | Execution has not produced a result yet |
| Disabled | Inactive, pause | The rule did not run because it was disabled |
| Execution unavailable | Orange, circle alert | The check could not be completed |

`not_applicable` is a distinct stored type and filter option with its own count, sort order and persisted visibility. It must work in search, summary, report and copy. Do not merge it with information, disabled or execution failure. Unknown protocol does not mean HTTPS. For an HTTPS page, the password-on-HTTP check reports page URL as checked input, HTTPS as observed protocol, and password fields as not checked.

Favoriting does not change status. Disabling a rule after a completed result preserves the evidence and status, with `Next run: Disabled`; it changes future execution settings. A rule that never ran has the disabled state.

## Interactions and accessibility

Details/Hide is visibly a button, with a chevron, `aria-expanded` and a relationship to its detail region. Status icons have accessible names; purely decorative icons are hidden from assistive technology. Favorite uses a distinct filled library star, never replaces status.

Actions: Favorite/Unfavorite, Disable/Enable rule, Open in full report. Preserve existing application settings and report navigation. Unavailable actions are disabled or absent with an accurate explanation, never silently inert. Open in full report targets the same run and rule result.

The actions menu supports Enter/Space, arrow navigation, Home/End, Escape, Tab and outside click. Escape restores focus to the trigger. No hover-only controls. Visible focus indicators are required. All fields have associated visible labels. IDs are unique across two cards of the same rule.

Copy includes the speaking name, status, tested page URL, actual checked input, every labelled value including extracted title text, checked criteria, retained complete evidence, omissions, references and technical metadata. Copy feedback is announced. On clipboard failure, show selectable assembled report text outside an original-data form field.

## Architecture and enforcement

Use one typed presentation contract and shared renderer. Rules produce facts; components do not run SEO checks, infer verdicts or rewrite captured values. Keep source capture, presentation construction, validation, copy formatting and UI components separate and small. Use Tailwind and the existing React stack; use library icons. Rule-specific conditional layout in the renderer is forbidden.

Validation must reject missing/blank keys, non-scalar display values, invalid reference URLs, unlabelled evidence, original fields lacking fidelity, unknown statuses and incomplete contract variants. References are resolved centrally so missing-reference fallback is consistent in card and copy output. A migrated rule must emit the contract on every result branch, including missing data and unavailable execution.

Lint and tests must enforce the migration allowlist and prohibit advice/dump fields in migrated output. Use negative fixtures that intentionally contain invalid references, missing labels, nested objects, incomplete original fields and truncated transport values. Do not make lints accept invalid data by silently coercing it to strings.

## Required verification

- Unit tests: every migrated rule's present, absent, empty, multiple and applicable failure branches; special parsing cases as relevant; original attributes and nested markup preserved; reference preservation/fallback; no generated advice.
- Pipeline tests: native DOM versus reconstructed facts; storage and phase-message bounds; partial and omitted evidence explicitly reported; not-applicable type survives validation, sorting and filters.
- Headless UI: overview/detail, narrow layout, keyboard menu, copy success/failure, favorite persistence, disable/enable, reference links, neutral data links, readonly raw data, exact copied markup, labelled metadata, no horizontal overflow.
- Run typecheck, lint, unit tests and build before every logical commit. Test browser runs are headless. Keep local artifacts private and retain superseded generated outputs in trash.
- Continue until every existing registry rule is migrated. The final handover names the committed code, required commands, test evidence and known limitations. Do not claim an unreviewed rule has been migrated. Copy the final handover to the clipboard and call `say` when all work is finished.
