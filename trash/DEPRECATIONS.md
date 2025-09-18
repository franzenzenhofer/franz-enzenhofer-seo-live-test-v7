Deprecated/Not feasible in MV3 (notes)

- speed:first-paint (deprecated)
  - Reason: MV3 service worker/offscreen context cannot observe First Paint/FCP timing directly.
  - Workaround: Capture FCP/FP via a content script PerformanceObserver and persist it into the pipeline; can be implemented if required.

- http:h2-detection (superseded)
  - Replaced by atomic rules:
    - http:h2-advertised (Alt-Svc)
    - http:h3-advertised (Alt-Svc)
    - http:alt-svc-other (reports quic/spdy/etc.)
  - Reason: split overly broad detection into atomic checks.

- MV3 headless E2E
  - Chrome headless often does not expose MV3 service workers/content scripts.
  - CI runs E2E headfully (xvfb) without mocks; headless path fails loudly by design.

