import { afterEach, describe, expect, it, vi } from 'vitest'

import { internalLinkStatusRule } from '@/rules/body/internalLinkStatus'
import { collectDomFacts } from '@/shared/domFacts.collect'
import { domFactsToDocument } from '@/shared/domFacts.document'

const makeDoc = (html: string) => new DOMParser().parseFromString(html, 'text/html')

describe('rule: internal link status on the bounded fact document', () => {
  afterEach(() => vi.restoreAllMocks())

  it('reports the true page anchor total, not the bounded sample, as the total', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 200 }))
    const links = Array.from({ length: 300 }, (_, i) => `<a href="/p${i}">x</a>`).join('')
    const facts = collectDomFacts(makeDoc(`<html><head><title>T</title></head><body>${links}</body></html>`), 'static')
    expect(facts.truncatedBuckets).toContain('anchor')
    const doc = domFactsToDocument(facts, makeDoc)
    const r = await internalLinkStatusRule.run(
      { html: '', url: 'https://example.com/', doc, staticFacts: facts } as never,
      { globals: {} },
    )
    expect(r.type).toBe('ok')
    expect(r.details?.['pageAnchorCount']).toBe(300)
    expect(r.details?.['anchorEvidenceTruncated']).toBe(true)
    // The message must not present the tiny bounded sample as the page total.
    expect(r.message).not.toMatch(/sample of \d+ internal links\.$/)
    expect(r.message).toContain('300')
  })

  it('does not lie when the bounded sample holds only nav/cross-host anchors (orf.at shape)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 200 }))
    const nav = ['#top', '#nav', ...Array.from({ length: 8 }, (_, i) => `https://sub${i}.example.org/`)]
      .map((href) => `<a href="${href}">n</a>`).join('')
    const internal = Array.from({ length: 36 }, (_, i) => `<a href="/story${i}">s</a>`).join('')
    const facts = collectDomFacts(makeDoc(`<html><head><title>T</title></head><body>${nav}${internal}</body></html>`), 'static')
    expect(facts.anchorCount).toBe(46)
    expect(facts.truncatedBuckets).toContain('anchor')
    const doc = domFactsToDocument(facts, makeDoc)
    const r = await internalLinkStatusRule.run(
      { html: '', url: 'https://example.com/', doc, staticFacts: facts } as never,
      { globals: {} },
    )
    expect(r.type).toBe('runtime_error')
    expect(r.message).not.toContain('No internal links found')
    expect(r.message).toContain('captured anchors')
    expect(r.details?.['pageAnchorCount']).toBe(46)
  })

  it('fails loudly instead of claiming "no internal links" when anchors were sampled away', async () => {
    // The collector now reserves budget for anchors, so a capture with zero
    // anchors on an anchor-bearing page cannot be produced any more; this
    // guards the rule against any facts payload that still arrives that way.
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 200 }))
    const doc = makeDoc('<html><head><title>T</title></head><body><p>x</p></body></html>')
    const facts = {
      ...collectDomFacts(doc, 'static'),
      anchorCount: 5,
      truncatedBuckets: ['anchor' as const],
    }
    const r = await internalLinkStatusRule.run(
      { html: '', url: 'https://example.com/', doc, staticFacts: facts } as never,
      { globals: {} },
    )
    expect(r.type).toBe('runtime_error')
    expect(r.message).not.toContain('No internal links found')
  })
})
