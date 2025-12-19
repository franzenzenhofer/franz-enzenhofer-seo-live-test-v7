# Ticket: AI robots.txt integration (future work)

- Reference: https://ai-robots-txt.franzai.com/
- Idea: leverage hosted AI robots.txt analyzer to surface robots.txt insights in the extension:
  - Fetch robots.txt once per origin, send to AI endpoint, return structured findings (policy gaps, missing sitemaps, misconfigurations).
  - Cache responses (per origin) and respect size/time budgets; offline fallback to current local parsing.
  - Only enable when user opts in and when URL is covered by a verified Search Console property (avoid unnecessary traffic).
- Not implemented yet; to be scheduled.***
