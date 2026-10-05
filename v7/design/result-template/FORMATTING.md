# Result-card formatting doctrine

Date: 2026-10-05. Scope: every migrated rule's `Presentation` (schema in `src/shared/presentation/schema.ts`), as rendered by `src/components/presentation/Card.tsx`, `Fields.tsx`, `Details.tsx`. This document is the yardstick for fixing all 130 rules and the source of the automated formatting tests. SPEC.md, DECISIONS.md and LINTING.md stay in force; where this document is stricter, this document wins.

Evidence base: the dump of all 130 rules on three real pages (chefs.example.com profile with `?hl=en`, apple.com with 137 hreflang links, theguardian.com/international) and the owner's screenshots of `Canonical Link` (bad) and `Page title length` (good).

## 1. The end user

An SEO professional with a ~400 px wide side panel open next to a page, scanning 100+ cards after a run. Per collapsed card they spend about two seconds. In those two seconds they must know, without opening details:

1. what was checked (card name plus the first row),
2. what the page actually has (the observed value or the original markup),
3. what it was compared against (for example the current page URL),
4. the verdict (status colour and icon, confirmed by one factual row when a comparison was made).

When they open details they expect the complete picture: every inspected element's original markup, one evidence record per element, the exact selector and criterion. They never expect "137 found" and then nothing.

## 2. How the tests read a card

- `P = boundResult(result).presentation`: the tests run over the bounded presentation, which is what the panel stores and shows. Run every migrated rule against the real-page fixtures (saved static DOM, headers and URL of the three dump pages) plus the lint fixtures in `scripts/lint-result-presentations.ts`.
- `overview = P.values`. `details = P.detailValues`. `checked = P.checked`. `evidence = P.evidence`. `markup = P.markup`. The `Checked input` line is rendered by the card, it is not an overview row.
- `N` (found count): the value of the first overview `text` field whose value is a number; when no numeric field exists, `N = markup.length`.
- "key" is `field.key` as the rule emits it; the renderer appends the colon.
- The absence vocabulary (F11) is the closed set `Not found`, `Absent`, `Not declared`, `Not captured`, `Not checked`, `None`, `Request failed`.
- A rule that cannot be checked mechanically says `Test: manual review`. Everything else is a vitest assertion that fails per rule and fixture.

## 3. Rules

### F1. Overview order: observed value, then what it was compared to, then the `Comparison` row, then the original markup

Why: the colour already gives the verdict; the first row must answer "what does the page have", and the markup field is the proof that closes the card.

BAD (head-canonical, chefs-example):
```
Canonical links: 1
Canonical href (observed): https://chefs.example.com/@alex-3ms
Resolved canonical URL: https://chefs.example.com/@alex-3ms
Absolute URL: Yes
Self-reference: No
Comparison: Canonical points to a different URL
```
GOOD:
```
Canonical URL: https://chefs.example.com/@alex-3ms                      {url}
Current page URL: https://chefs.example.com/@alex-3ms?hl=en             {url}
Comparison: Differs from current page URL (query)
<link rel="canonical">: <link rel="canonical" href="https://chefs.example.com/@alex-3ms">   {original}
```
Test: in `overview`, the index of every `original` field is greater than the index of every non-original field; if a field with key `Comparison` exists it is the last non-original field; the first overview field is never a numeric 1.

### F2. A comparison shows both sides and names its verdict from a closed set

Why: "points to a different URL" is useless without the URL it differs from; the user must not open details to learn what the rule compared.

BAD (og:url, apple): `og:url: Consistent` and `Declared URL (trimmed): https://www.apple.com/`; the canonical URL and document URL it was found consistent with sit in details only.
GOOD:
```
og:url: https://www.apple.com/            {url}
Canonical URL: https://www.apple.com/     {url}
Comparison: Equals canonical URL
<meta property="og:url">: <meta property="og:url" content="https://www.apple.com/">   {original}
```
Test: if `overview` has a key `Comparison`, or any overview text value matches `/\b(differs?|different|matches|equals?|same|self-referenc\w*|aligns?|consistent|mismatch|conflict)/i`, then (a) `overview` contains at least two `url` fields, (b) one of them has a key from the comparison-target vocabulary in F11 (`Current page URL`, `Final URL`, `Canonical URL`, `HTTP canonical`, `og:url`), (c) the `Comparison` value matches `/^(Equals|Differs from|Relative|Conflicting|Only|Not comparable)\b/` and is at most 60 characters.

### F3. No redundant rows

Why: every row costs scan time; a row that repeats another row, the colour, or the checked input is noise that hides the finding.

BAD (head-canonical, chefs-example): `Canonical href (observed)` and `Resolved canonical URL` carry the same string; `Absolute URL: Yes` and `Self-reference: No` restate `Comparison`; `Canonical links: 1` restates the single markup field. Also http:https-scheme (all pages): `Scheme: https:` plus `HTTPS in use: Yes`; http:gzip: `Header source: captured` repeats the checked input.
GOOD: see F1; http:https-scheme becomes the single row `Scheme: https:`.
Test: (a) no two `overview` fields have the same `String(value)`, except two `url` fields when a `Comparison` key exists (a self-reference legitimately shows the same URL twice); (b) no overview text value is exactly `Yes` or `No`; (c) no overview numeric value equals 1 while `markup.length === 1`; (d) no overview value equals `P.input` or `captured`.

### F4. Element checks show the original markup in the overview, labelled by its tag

Why: `<title>:` with the real element is the format the owner calls correct; the markup is the observed value, the SEO reads attributes at a glance and needs no "Absolute URL: Yes" interpretation.

BAD (head-canonical, apple): the element `<link rel="canonical" href="https://www.apple.com/">` is only in details under `Canonical link 1`; the overview shows its URL twice as text. head-robots-meta (chefs-example): `robots meta tags: 1`, `Contains noindex: No`, `Contains nofollow: No`, markup hidden in details as `robots meta tag 1`.
GOOD (head-robots-meta, chefs-example):
```
Instruction: index, follow
Applies to: all crawlers
<meta name="robots">: <meta name="robots" content="index, follow">   {original}
```
Test: if `N >= 1`, `1 <= markup.length <= 3` and every `markup[i].value.length <= 500`, then every `markup[i].value` appears as an `original` field in `overview` (longer originals such as JSON-LD blocks stay in details and the overview carries their derived row, for example `Declared types: Organization, WebSite, WebPage`; inspected-but-unmatched elements, `N = 0`, stay in details); every `original` key in `overview` and `markup` matches `/^<[a-z][a-z0-9-]*( [^<>]+)?>( \d+)?$/` (examples: `<title>`, `<h1>`, `<link rel="canonical">`, `<link hreflang="en">`, `<script type="application/ld+json"> 2`); no original key matches `/\b(markup|tag|element|link|source) \d+$/i`.

### F5. N found means N shown: details never ship zero evidence and zero markup

Why: "Hreflang links: 137" with an empty details view is the complaint verbatim; a found element that is not listed is a false absence.

BAD (head-hreflang, apple): overview `Hreflang links: 137`, `EVIDENCE: 0 records`, `MARKUP: 0 fields`, noMarkup `Original markup omitted: 10 record(s); storage capacity exceeded`. Same pattern: body:images-layout apple (101 found, 0 shipped), body:internal-links all pages, body:parameterized-links apple and guardian, head:hreflang-multipage apple (105 issues, 0 records).
GOOD: 137 evidence records (one per link, F7) and as many original `<link hreflang="…">` fields as the 32 KB budget holds, with truthful counts (F6).
Test: if `N > 0` and `P.input` contains `Static DOM` or `Idle DOM`, then `evidence.length + markup.length >= 1`; additionally `markup.length >= 1` unless `P.noMarkup` starts with `Not retained:` (capture-boundary limitation such as the `<html>` element), in which case `evidence.length >= 1`. The bounder may shrink the lists but the assertion holds on the bounded `P`.

### F6. Retained and omitted counts are truthful, use four fixed keys, and add up

Why: a card that says "retained: 10" and ships 0 lies to the user; the counts are how the user knows whether to trust the sample.

BAD (head-hreflang, apple): `Markup elements retained: 10`, `Markup elements omitted: 127`, `Evidence records omitted: 137`, yet 0 markup and 0 evidence shipped; the labels differ per rule (`Elements`, `Examples`, `Link records`, `Attribute pairs`, `Scripts`, `Blocks`, `Declarations shown`).
GOOD (head-hreflang, chefs-example): `Markup retained: 6`, `Markup omitted: 0`, `Evidence retained: 6`, `Evidence omitted: 0`.
Test: the only keys ending in ` retained` or ` omitted` anywhere in `P` are `Markup retained`, `Markup omitted`, `Evidence retained`, `Evidence omitted`, and they appear only in `details`; the four rows are present whenever `N > 0`, `markup.length > 0` or `evidence.length > 0`; when present, `Markup retained === markup.length` and `Evidence retained === evidence.length`; when `N > 0`, `Markup retained + Markup omitted === N` and `Evidence retained + Evidence omitted === N`; no key contains `(storage limit)` (the bounder updates the four rows instead of appending new ones).

### F7. One evidence record per inspected element, named by the element

Why: evidence is "this element, here, with these attributes"; a record called `Capture` holding `DOM path 1` to `DOM path 11` cannot be read, copied or attributed.

BAD (head:canonical-hreflang-consistency, apple): one record `Capture` with eleven `DOM path n` fields. schema:* (apple, 10 rules): record `Capture: Scripts retained: 3 | Scripts omitted: 0 | Parse errors omitted: 0 | DOM path 1 … DOM path 3`.
GOOD:
```
Evidence
  <link rel="canonical">      href: https://www.apple.com/ {url}   DOM path: html.no-js > head > link:nth-of-type(1)
  <link hreflang="en-US">     hreflang: en-US   href: https://www.apple.com/ {url}   DOM path: html.no-js > head > link:nth-of-type(2)
```
Test: every evidence record has at most one `path` field and its key is exactly `DOM path`; no record name matches `/^(Capture|Capture status|Source|Source locations|Retrieved source elements|Checked headers)$/`; no evidence field key ends in ` retained` or ` omitted`; no evidence field key matches `/^DOM path \d+$/`.

### F8. Overview keys are at most 20 characters, detail keys at most 32

Why: `Fields.tsx` keeps the value beside the label only while label + 8 px gap + 160 px (`basis-40`) fit the row; otherwise the value drops to its own line and the card doubles in height. Derivation at 400 px: panel 400 - list `p-3` 24 - card border 2 - card `px-3` 24 = 350 px row; with a classic scrollbar 335 px; label budget 335 - 8 - 160 = 167 px; `text-sm` (14 px) averages about 7.3 px per glyph in the system UI font (the screenshot shows `Resolved canonical URL:` at 23 glyphs wrapping and `Canonical links:` at 16 glyphs staying); 167 / 7.3 = 22 glyphs including the colon, so a key of 20 characters is the limit.

BAD: `Canonical href (observed)` (25), `Hreflang targets declared` (25), `Linked images missing alt or text` (33), `PageSpeed Insights API response` (31), `Same-origin resources checked` (29), `Agent-specific robots meta tags` (31), `Strict-Transport-Security` (25).
GOOD: `Canonical href`, `Targets declared`, `Images without alt`, `PSI response`, `Resources checked`, `Agent robots tags`, `HSTS`.
Test: every non-original key in `overview` has `key.length <= 20`; every key in `details`, `checked` and evidence fields has `key.length <= 32`; `original` keys are exempt (they render on their own line).

### F9. URLs are `url` fields; a text value never embeds a URL

Why: a URL in a text row is not clickable and not resolvable; a URL inside an error sentence is unreadable at 335 px.

BAD (http:soft-404, chefs-example): `Probe failure: Redirect chain fetch failed at https://chefs.example.com/fake-url-for-soft-404-error-check-15165324347: Network disabled (0 hops captured before failure)`. head-canonical (chefs-example) details: `Normalized page URL: https://chefs.example.com/@alex-3ms?hl=en` as text. head:canonical-noindex-conflict: `HTML canonical: https://chefs.example.com/@alex-3ms` as text.
GOOD (http:soft-404):
```
Probed URL: https://chefs.example.com/fake-url-for-soft-404-error-check-15165324347   {url}
Request: Failed
Error: Network disabled
```
Test: no `text` field in `overview`, `details` or evidence has a value matching `/https?:\/\//` (`checked` and `original` are exempt); every `url` field value is non-empty, contains no whitespace, is not an absence word, and `new URL(value, P.pageUrl)` succeeds with an http(s) protocol.

### F10. Values are facts, not sentences

Why: a sentence has to be read; a fact is seen. Criteria and explanations belong in `checked`, never in a value.

BAD (head:canonical-nav-consistency, chefs-example): `Navigation comparison: Points to a different URL than the final URL`. http:cache-delivery: `Cache indication: No evidence of shared-cache delivery`. discover:headline-length (chefs-example): `Heuristic threshold: 20 characters; Google sets no minimum length` as an overview row.
GOOD: `Comparison: Differs from final URL (query)`; `Age: Absent`; the threshold sentence moves to `checked` as `Criterion`.
Test: overview `text` values are at most 60 characters, contain no `. ` and no parenthesised explanation longer than 12 characters; `details` text values are at most 120 characters; evidence text values at most 160; `checked` is exempt.

### F11. One vocabulary across all 130 rules

Why: the same thing under five labels reads as five different things; the user learns the vocabulary once and then scans by position.

Keys (replacing every variant seen in the dump):

| Key | Replaces |
| --- | --- |
| `Current page URL` | Page URL, Normalized page URL, Document URL, Compared URL (page URL), Original URL, Requested page URL, Base URL |
| `Final URL` | Final navigation URL, Normalized final URL |
| `First URL` | First navigation URL |
| `Canonical URL` | Resolved canonical URL, Canonical href (observed), HTML canonical, Normalized canonical URL, Canonical URL used for comparison, Declared canonical href |
| `Canonical href` | only when the raw attribute is not already an absolute URL equal to `Canonical URL` (relative or malformed href) |
| `HTTP canonical` | HTTP Link header (raw), Link header rel=canonical |
| `Comparison` | Navigation comparison, Self-reference, Cluster status, Conflict, Self-reference comparison |
| `DOM path` | DOM path 1, Selector (for a found element) |
| `Error` | Probe failure, Probe failed, Findings |

Values: absence words come from the closed set in section 2 (`Not found` for a queried element or attribute, `Absent` for an HTTP header, `Not declared` for an attribute on a found element, `Not captured` for an unavailable input, `Not checked` for a failed precondition, `None` for an empty list, `Request failed` for a failed probe). Banned: `Not present`, `Not observed`, `Not observed in checked input`, `Missing`, `Not stored`, `Not recorded`, `Not detected`, `Not reported`, `Not determined`, `Not performed`, `Unknown`, `Unavailable`, `Unreachable`. Label suffixes `(observed)`, `(trimmed)`, `(raw)`, `(reconstructed)`, `(first 100 characters)` are banned; the field kind and placement state fidelity.

BAD: the current page URL appears as `Page URL` (head:canonical-https-preference), `Final navigation URL` (head:canonical-nav-consistency), `Compared URL (page URL)` (http:redirect-canonical-chain), `Original URL` (url:trailing-slash), `Requested page URL` (psi:mobile). head:canonical-noindex-conflict: `Noindex`, `Noindex meta`, `Noindex header`, each `Not observed in checked input`.
GOOD: `Current page URL` everywhere; head:canonical-noindex-conflict: `noindex: Not found` once, sources in `checked`.
Test: no key equals a string in the "Replaces" column; no key matches `/\((observed|trimmed|raw|reconstructed|first \d+ characters)\)$/i`; every value that starts with `Not ` or equals `Missing`, `Unknown`, `Unavailable` or `Unreachable` is in the closed set; `Canonical href` is present only if its raw value is not identical to the `Canonical URL` value (a relative href stays, as in the worked layout).

### F12. The overview carries an observed value, never only a count

Why: "Preload links: 2" tells the SEO nothing; the two hrefs do.

BAD (speed:link-preload, chefs-example): overview is `Preload links: 2`, the hrefs sit in details. body:internal-links (chefs-example): `Internal links: 29`, `External links: 7`, nothing else, and 0 evidence.
GOOD (speed:link-preload, chefs-example):
```
Preload links: 2
<link rel="preload"> 1: <link rel="preload" as="script" fetchpriority="low" href="/_next/static/chunks/3uejelrih9i5f.js">   {original}
<link rel="preload"> 2: <link rel="preload" href="/_next/static/chunks/38-x1nvyewe3z.js" as="script" fetchpriority="low">   {original}
```
For inventories with `N > 3` the overview shows the count plus one derived summary row, at most 60 characters, for example `Languages: en-US, ar-AE, en-AE, en-AM, de-AT ... 132 more` or `External hosts: instagram.com, facebook.com ... 5 more`.
Test: if `N > 0`, `overview` contains at least one field that is kind `url` or `original`, or a `text` field whose value is not numeric, not in the absence set and not `Yes`/`No`.

### F13. Unavailable input is declared once, as the checked input

Why: `Navigation data: Not captured` under a checked input of `HTTP response headers` claims an input that was never the problem; the user must see at a glance that the rule had nothing to check and why.

BAD (http:navigation-path, all pages): overview `Navigation data: Unavailable`, checked input `HTTP response headers`. http:redirect-loop: `Navigation data: Not captured`, checked input `HTTP response headers`. body:unsecure-input: `Applicable: No` followed by a prose reason.
GOOD: checked input `Not captured`, overview `Navigation events: Not captured`. body:unsecure-input: `Page protocol: https:` and `Password fields: Not checked`.
Test: `P.input === 'Not captured'` if and only if exactly one overview value equals `Not captured`; no overview key equals `Applicable`; a `not_applicable` result has an overview row whose value is `Not checked`.

### F14. Details never repeat the overview

Why: expanding a card must add information; a repeated URL under a new label makes the user compare strings for nothing.

BAD (head:canonical-https-preference, chefs-example): detail `Canonical href (observed): https://chefs.example.com/@alex-3ms` repeats the overview `Canonical URL`. head-canonical (apple): `Normalized page URL` and `Normalized canonical URL` repeat the two overview URLs character for character.
GOOD: details add only new facts; the normalization rule is one `checked` row (`Normalization: fragment removed, host lowercased, query kept`).
Test: no `details` field has `String(value)` equal to any `overview` field value; no `checked` key equals an `overview` key.

### F15. Read aloud, the collapsed card makes sense to an SEO who has never seen the rule

Why: this is the two-second test itself. Read the card name and rows top to bottom as "name: key value, key value". If the listener cannot say what was checked, what the page has, what it was compared to and the verdict, the card fails.

BAD (head-canonical, chefs-example, read aloud): "Canonical Link: canonical links one, canonical href observed chefs-example alex, resolved canonical URL chefs-example alex, absolute URL yes, self-reference no, comparison canonical points to a different URL." Different from what?
GOOD: "Canonical Link: canonical URL chefs-example alex, current page URL chefs-example alex hl en, comparison differs from current page URL by query, link rel canonical markup."
Test: manual review, one reviewer per rule, recorded in MIGRATION.md.

## 4. Worked layouts

Legend: `{url}` = url field, `{original}` = readonly original field; everything else is text. The checked input is the small line at the bottom right of the collapsed card.

### Canonical Link (head-canonical)

Self-reference (apple, Passed):
```
Canonical URL: https://www.apple.com/                 {url}
Current page URL: https://www.apple.com/              {url}
Comparison: Equals current page URL
<link rel="canonical">: <link rel="canonical" href="https://www.apple.com/">   {original}
                                                          Static DOM + Page URL
```
Differs (chefs-example, Criterion not met):
```
Canonical URL: https://chefs.example.com/@alex-3ms           {url}
Current page URL: https://chefs.example.com/@alex-3ms?hl=en  {url}
Comparison: Differs from current page URL (query)
<link rel="canonical">: <link rel="canonical" href="https://chefs.example.com/@alex-3ms">   {original}
```
The parenthesis names the first differing URL component (scheme, host, path, query). guardian: `https://www.theguardian.com/` vs `https://www.theguardian.com/international`, `Comparison: Differs from current page URL (path)`; `Canonical href` is not shown because the raw `https://www.theguardian.com` resolves to the shown `Canonical URL` (F11).

Relative (fixture `<link rel="canonical" href="/trips?q=a">` on https://example.test/):
```
Canonical href: /trips?q=a
Canonical URL: https://example.test/trips?q=a         {url}
Current page URL: https://example.test/               {url}
Comparison: Relative href, differs from current page URL (path)
<link rel="canonical">: <link rel="canonical" href="/trips?q=a">   {original}
```
Missing (fixture `absent`, Criterion not met):
```
Canonical link: Not found
```
Details: `Checked input: Static DOM`, `Selector: link[rel~="canonical" i]`, criteria, `Retrieved markup: No matching canonical link element found`.

Multiple (fixture with two canonical links, Failed):
```
Canonical links: 2
Canonical URL 1: https://example.test/a                {url}
Canonical URL 2: https://example.test/b                {url}
Current page URL: https://example.test/a               {url}
Comparison: Conflicting, 2 canonical links declared
<link rel="canonical"> 1: <link rel="canonical" href="https://example.test/a">   {original}
<link rel="canonical"> 2: <link rel="canonical" href="https://example.test/b">   {original}
```
Details for every state: `Checked input`, the four count rows (F6), `Selector`, `Selection`, `Placement criterion`, `Href criterion`, `Normalization`, then one evidence record per element named `<link rel="canonical">` (numbered when several) with `DOM path`, then references and footer. No `Normalized page URL` and `Normalized canonical URL` rows (F14).

### Page title length (head:title) - keep exactly as it is

```
Characters: 52
<title>: <title>Alex  - Chef Entremetier @ Restaurant Example | ExampleChefs</title>   {original}
                                                                     Static DOM
```
Why it is right: row one is the measured number with its unit, which is the thing this rule is about (F1, F12); row two is the complete original element the number was measured on, labelled by its tag (F4); nothing restates the colour, nothing is a sentence, no Yes/No, no count of 1 (F3, F10); both keys are short (F8); the details add only new facts (`Title: ...` without tags, `Selector`, `Measurement`, `Length threshold: None`, one `DOM path`) (F14). Only the detail row `Title elements: 1` may go; it is not an overview row, so F3 does not fail it.

### Hreflang Links (head-hreflang)

6 links (chefs-example):
```
Hreflang links: 6
Languages: x-default, en, fr, es, de, it
                                                                     Static DOM
```
Details:
```
Checked input: Static DOM
Markup retained: 6    Markup omitted: 0    Evidence retained: 6    Evidence omitted: 0
Selector: head > link[rel~="alternate" i][hreflang]
Selection: All matches
Criterion: Informational inventory; no pass/fail verdict
Evidence
  <link hreflang="x-default">   hreflang: x-default   href: https://chefs.example.com/@alex-3ms {url}   DOM path: html... > head > link:nth-of-type(5)
  <link hreflang="en">          hreflang: en          href: https://chefs.example.com/@alex-3ms?hl=en {url}   DOM path: ...
  ... (6 records, one per link)
Retrieved markup
  <link hreflang="x-default">: <link rel="alternate" hreflang="x-default" href="https://chefs.example.com/@alex-3ms">   {original}
  <link hreflang="en">: <link rel="alternate" hreflang="en" href="https://chefs.example.com/@alex-3ms?hl=en">   {original}
  ... (6 fields)
```
The overview shows no markup because `N > 3` (F4); the languages row is the observed value (F12). `Distinct languages: 6` is gone because it equals the count (F3a); it returns only as `Duplicate hreflang values: de, en` when duplicates exist.

137 links (apple):
```
Hreflang links: 137
Languages: en-US, ar-AE, en-AE, en-AM, de-AT, en-AU ... 131 more
x-default: Not declared
```
Details: the same four count rows with real numbers; 137 evidence records (about 130 bytes each, about 18 KB) and as many `<link hreflang="...">` original fields as fit the 32 KB budget (about 85 bytes each, so all 137 fit, otherwise `Markup retained: 120`, `Markup omitted: 17`). The `sampleElements` cap of 10 does not apply to inventories; the byte budget is the only bound and the counts state it (F5, F6). Zero records for 137 found links is the exact failure the owner reported.

## 5. The 15 worst cards in the dump

Ranked by damage to the two-second read, worst first.

1. head-canonical (chefs-example, guardian): count first, verdict last, no current page URL, same URL twice, two Yes/No rows, markup only in details, five labels for the same thing. F1, F2, F3, F4, F8, F11, F14.
2. head-hreflang (apple): 137 found, 0 evidence, 0 markup, counts claim 10 retained; 6-link case has no markup in the overview summary. F5, F6, F7, F12.
3. head:hreflang-multipage (apple): 105 issues found, 0 records shipped; chefs-example records carry the same error sentence twice (`Error` and `Findings`) with embedded URLs. F5, F6, F9, F10, F11.
4. body:images-layout (apple, guardian): 101 and 116 images missing dimensions, 0 evidence, 0 markup, `Evidence records omitted: 10` contradicts `Affected examples retained: 10`. F5, F6, F12.
5. body:internal-links (all pages): counts only, 0 evidence, noMarkup claims storage exceeded for 13 records. F5, F6, F12.
6. body:parameterized-links (apple, guardian): 20 and 10 links found, 0 shipped, `Markup records retained: 1` with 0 markup. F5, F6.
7. body:images-lazy (apple, guardian): 101 and 116 images classified, 0 evidence, 0 markup. F5, F6, F12.
8. head:canonical-hreflang-consistency (apple): one `Capture` record with 11 DOM paths, markup named `Canonical and hreflang n`, `Canonical in cluster: Found` plus `Cluster status: Aligned` say the same thing. F3, F4, F6, F7.
9. head:canonical-nav-consistency (chefs-example, guardian): five URL rows where first and final URL are identical, `Navigation comparison` is 21 characters and a sentence, details repeat the overview URLs under `Normalized` labels. F2, F3, F8, F10, F11, F14.
10. head:canonical-noindex-conflict (all pages): six overview rows, three of them `Not observed in checked input`, canonical URL as text, `Canonical sources: 1` count row. F3, F9, F10, F11, F12.
11. http:redirect-canonical-chain (chefs-example, guardian): the row labelled `Canonical URL` holds the sentence `Points to another preferred URL`, the URLs are in details under `Compared URL (page URL)` and `Declared canonical href`. F2, F9, F10, F11.
12. schema:* family (apple, 10 rules): `Matching entities: 0` and `JSON-LD parse errors: 0` while three JSON-LD blocks are shipped under one `Capture` record with `Scripts retained` counts inside evidence; the declared types (Organization, WebSite, WebPage) never reach the overview. F6, F7, F12.
13. body:internal-link-status (all pages): `Status summary: 5× 0`, `Links tested: 5` with `Inconclusive: 5`, every record repeats the probe URL inside an error sentence. F3, F9, F10.
14. http:soft-404 and url:trailing-slash (chefs-example, guardian): the overview is one error sentence with the probed URL embedded; url:trailing-slash adds `Checked variant` and `Original version` as prose while the two URLs sit in details. F2, F9, F10, F11.
15. Robots meta family (head-robots-meta, head:robots-noindex, head:meta-googlebot, head:meta-other-robots, http:x-robots; all pages): `Contains noindex: No` and `Contains nofollow: No` even when 0 tags exist, count of 1 with the single markup hidden in details, markup keys `robots meta tag 1`. F3, F4, F12.
