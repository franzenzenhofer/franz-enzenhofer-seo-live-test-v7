import { describe, it, expect } from 'vitest'

import { collectDomFacts } from '@/shared/domFacts.collect'
import { domFactsToDocument } from '@/shared/domFacts.document'

const makeDoc = (html: string) => new DOMParser().parseFromString(html, 'text/html')

// A real news article head (orf.at measured 48 head elements) used to overflow the
// old 40-element cap, dropping canonical / robots and silently killing 16 rules.
const bigHead = (extra: string) => `<!doctype html><html><head>
  <title>T</title>
  ${Array.from({ length: 60 }, (_, i) => `<meta name="filler-${i}" content="v${i}">`).join('\n')}
  ${extra}
</head><body><p>hi</p></body></html>`

describe('domFacts critical elements', () => {
  it('keeps canonical and robots even past the head sampling limit', () => {
    const doc = makeDoc(bigHead('<link rel="canonical" href="https://x.test/a"><meta name="robots" content="noindex">'))
    const facts = collectDomFacts(doc, 'static')
    const rebuilt = domFactsToDocument(facts, makeDoc)
    expect(rebuilt.querySelector('link[rel~="canonical" i]')?.getAttribute('href')).toBe('https://x.test/a')
    expect(rebuilt.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('noindex')
    expect(facts.criticalTruncated).toBe(false)
  })

  it('keeps every head meta, since each one can carry a robots directive', () => {
    const doc = makeDoc(bigHead('<meta name="googlebot" content="nosnippet">'))
    const facts = collectDomFacts(doc, 'static')
    const rebuilt = domFactsToDocument(facts, makeDoc)
    expect(rebuilt.querySelectorAll('head > meta[name]').length).toBe(doc.querySelectorAll('head > meta[name]').length)
  })

  it('reports anchor truncation without flagging critical loss', () => {
    const anchors = Array.from({ length: 40 }, (_, i) => `<a href="/p${i}">l</a>`).join('')
    const doc = makeDoc(`<!doctype html><html><head><title>T</title></head><body>${anchors}</body></html>`)
    const facts = collectDomFacts(doc, 'static')
    expect(facts.truncatedBuckets).toContain('anchor')
    expect(facts.criticalTruncated).toBe(false)
    expect(facts.anchorCount).toBe(40)
  })

  it('always keeps insecure resources so mixed-content cannot false-negative', () => {
    const many = Array.from({ length: 40 }, (_, i) => `<img src="https://x.test/i${i}.png">`).join('')
    const doc = makeDoc(`<!doctype html><html><head><title>T</title></head><body>${many}<img src="http://insecure.test/bad.png"></body></html>`)
    const facts = collectDomFacts(doc, 'static')
    const rebuilt = domFactsToDocument(facts, makeDoc)
    expect(rebuilt.querySelector('img[src^="http://"]')?.getAttribute('src')).toBe('http://insecure.test/bad.png')
    expect(facts.criticalTruncated).toBe(false)
  })
})

describe('domFacts stays inside the phase message contract', () => {
  it('keeps a pathological head within the 32 KB phase budget', async () => {
    const { validatePhaseMessage } = await import('@/shared/phaseContract')
    const head = Array.from({ length: 400 }, (_, i) => `<meta name="n${i}" content="${'x'.repeat(300)}">`).join('')
    const body = Array.from({ length: 500 }, (_, i) => `<a href="/a${i}">l</a><img src="https://x.test/${i}.png">`).join('')
    const doc = makeDoc(`<!doctype html><html><head><title>T</title>${head}</head><body>${body}</body></html>`)
    const facts = collectDomFacts(doc, 'static')
    const check = validatePhaseMessage('document_end', { facts, url: 'https://x.test/', capturedAt: 0, navTiming: null })
    expect(check.ok).toBe(true)
    expect(facts.criticalTruncated).toBe(true)
  })
})
