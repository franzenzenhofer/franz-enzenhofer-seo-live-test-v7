# JIRA Epics - Round 9: Spec Coverage

## Context
- Source: 2026-09-02 gap-analysis workflow - 7 spec-domain agents swept official Google Search Central docs, RFCs, WHATWG, web.dev and amp.dev, diffed against the 127-rule inventory, dedup-reviewed (1 duplicate killed).
- Every proposal cites fetched spec URLs; Google Quality Rater Guidelines never appear as references.
- Rule implementation follows RUNBOOK "Add a new rule" (typed meta, static allowlist test).

## Severity Scale
- S1: Blocker
- S2: Major
- S3: Minor
- S4: Polish

## Epics

### EPIC-901: Crawling, indexing, robots.txt and sitemaps
- Outcome: Every page-level, spec-backed technical-SEO requirement in this domain has a rule.
- Categories: robots, sitemap, url - 18 proposed rules.
- Linked tickets: TCK-901, TCK-902, TCK-903, TCK-904, TCK-905, TCK-906, TCK-907, TCK-908, TCK-909, TCK-910, TCK-911, TCK-912, TCK-913, TCK-914, TCK-915, TCK-916, TCK-917, TCK-918

### EPIC-902: Search appearance: head signals and snippets
- Outcome: Every page-level, spec-backed technical-SEO requirement in this domain has a rule.
- Categories: head - 14 proposed rules.
- Linked tickets: TCK-919, TCK-920, TCK-921, TCK-922, TCK-923, TCK-924, TCK-925, TCK-926, TCK-927, TCK-928, TCK-929, TCK-930, TCK-931, TCK-932

### EPIC-903: Structured data coverage
- Outcome: Every page-level, spec-backed technical-SEO requirement in this domain has a rule.
- Categories: schema - 25 proposed rules.
- Linked tickets: TCK-933, TCK-934, TCK-935, TCK-936, TCK-937, TCK-938, TCK-939, TCK-940, TCK-941, TCK-942, TCK-943, TCK-944, TCK-945, TCK-946, TCK-947, TCK-948, TCK-949, TCK-950, TCK-951, TCK-952, TCK-953, TCK-954, TCK-955, TCK-956, TCK-957

### EPIC-904: Discover and content signals
- Outcome: Every page-level, spec-backed technical-SEO requirement in this domain has a rule.
- Categories: discover, body, dom - 18 proposed rules.
- Linked tickets: TCK-958, TCK-959, TCK-960, TCK-961, TCK-962, TCK-963, TCK-964, TCK-965, TCK-966, TCK-967, TCK-968, TCK-969, TCK-970, TCK-971, TCK-972, TCK-973, TCK-974, TCK-975

### EPIC-905: Performance: Core Web Vitals and delivery
- Outcome: Every page-level, spec-backed technical-SEO requirement in this domain has a rule.
- Categories: speed, psi - 10 proposed rules.
- Linked tickets: TCK-976, TCK-977, TCK-978, TCK-979, TCK-980, TCK-981, TCK-982, TCK-983, TCK-984, TCK-985

### EPIC-906: HTTP protocol and security
- Outcome: Every page-level, spec-backed technical-SEO requirement in this domain has a rule.
- Categories: http - 18 proposed rules.
- Linked tickets: TCK-986, TCK-987, TCK-988, TCK-989, TCK-990, TCK-991, TCK-992, TCK-993, TCK-994, TCK-995, TCK-996, TCK-997, TCK-998, TCK-999, TCK-1000, TCK-1001, TCK-1002, TCK-1003

### EPIC-907: Deprecation review of existing rules
- Outcome: No rule promises a retired Google feature; deprecated surfaces are labeled as such.
- Linked tickets: TCK-1004, TCK-1005, TCK-1006, TCK-1007, TCK-1008, TCK-1009, TCK-1010, TCK-1011, TCK-1012, TCK-1013, TCK-1014, TCK-1015, TCK-1016, TCK-1017, TCK-1018, TCK-1019, TCK-1020, TCK-1021, TCK-1022, TCK-1023, TCK-1024, TCK-1025, TCK-1026, TCK-1027, TCK-1028, TCK-1029, TCK-1030, TCK-1031, TCK-1032, TCK-1033, TCK-1034

### EPIC-908: Approved rule consolidations (Franz, 2026-09-02)
- Outcome: Only Franz-approved merges execute; everything else stays.
- Linked tickets: TCK-1035

## Decisions record (2026-09-02 checkpoint)
- robots_cluster: keep all three; fix parsing gaps instead (no merges)
- http_psi_cluster: delegated to Claude -> chosen: keep + upgrade (drop invented score in redirect-efficiency, teach alt-svc-other RFC 7838 'clear' + non-h2/h3 focus, threshold-grade psi:mobile-fcp-tbt)
- article_pair: MERGE ticket: one Article-presence rule = schema:article:present incl. BlogPosting; discover:article-structured-data keeps only unique Discover checks
- debug_page_summary: keep (not selected for merge)
- franz_provenance_list: confirmed as audited (18 rules)
