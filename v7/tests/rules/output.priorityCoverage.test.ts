import { describe, expect, it, vi, beforeAll, afterAll } from 'vitest'

import { registry } from '@/rules/registry'
import type { DomPhaseFacts } from '@/shared/domFacts.types'

const HTML = `<!doctype html><html lang="en"><head>
<title>Example Page Title</title>
<meta charset="utf-8">
<meta name="description" content="An example description for the sweep.">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="max-image-preview:large">
<link rel="canonical" href="https://example.com/page">
<meta property="og:title" content="Example"><meta property="og:image" content="https://example.com/i.jpg">
</head><body><h1>Example Heading</h1>
<a href="/internal">in</a><a href="https://other.example/x?y=1">out</a>
<img src="/a.jpg" width="10" height="10" loading="lazy" alt="a">
<script type="application/ld+json">{"@type":"Organization","name":"X","logo":"l","url":"u"}</script>
</body></html>`

const facts = (phase: 'static' | 'idle'): DomPhaseFacts => ({
  phase, nodeCount: 20, maxDepth: 5, textLength: 120, scriptCount: 1,
  blockingScriptCount: 0, anchorCount: 2, parameterizedLinkCount: 1,
  parameterizedLinks: ['/x?y=1'], parameterizedLinksTruncated: false,
  elements: [], elementsTruncated: false, truncatedBuckets: [],
  criticalTruncated: false, documentAttributes: [['lang', 'en']],
})

const fetchStub = vi.fn().mockImplementation(async () => ({
  ok: true,
  status: 200,
  redirected: false,
  url: 'https://example.com/x',
  body: null,
  headers: new Headers(),
  text: async () => 'User-agent: *\nDisallow:\nSitemap: https://example.com/sitemap.xml',
  json: async () => ({}),
}))

let originalFetch: typeof globalThis.fetch

beforeAll(() => {
  originalFetch = globalThis.fetch
  // @ts-expect-error network stub for the sweep - rules under test are real
  globalThis.fetch = fetchStub
})
afterAll(() => {
  globalThis.fetch = originalFetch
})

const page = () => ({
  html: HTML,
  url: 'https://example.com/page',
  doc: new DOMParser().parseFromString(HTML, 'text/html'),
  status: 200,
  headers: { 'content-type': 'text/html', 'content-encoding': 'gzip' },
  navigationTiming: { nextHopProtocol: 'h2', firstPaint: 500, firstContentfulPaint: 600 },
  resources: [],
  staticFacts: facts('static'),
  idleFacts: facts('idle'),
})

describe('every rule result carries an explicit numeric priority', () => {
  it('sweeps the full registry', async () => {
    const missing: string[] = []
    let checked = 0
    for (const rule of registry) {
      let result
      try {
        result = await rule.run(page() as never, { globals: {} })
      } catch {
        continue // rules needing live infrastructure are covered elsewhere
      }
      checked++
      if (typeof result.priority !== 'number') missing.push(`${rule.id} -> "${result.message}"`)
    }
    expect(missing).toEqual([])
    expect(checked).toBeGreaterThanOrEqual(120)
  }, 30000)
})
