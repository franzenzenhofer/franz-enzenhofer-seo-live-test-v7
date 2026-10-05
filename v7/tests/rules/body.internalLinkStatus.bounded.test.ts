import { afterEach, describe, expect, it, vi } from 'vitest'

import { enrichResult } from '@/core/runHelpers'
import { internalLinkStatusRule as rule } from '@/rules/body/internalLinkStatus'
import { collectDomFacts } from '@/shared/domFacts.collect'
import { domFactsToDocument } from '@/shared/domFacts.document'

const makeDoc = (html: string) => new DOMParser().parseFromString(html, 'text/html')
const value = (result: Awaited<ReturnType<typeof rule.run>>, key: string) => result.presentation?.values.find((field) => field.key === key)?.value
const detail = (result: Awaited<ReturnType<typeof rule.run>>, key: string) => result.presentation?.detailValues.find((field) => field.key === key)?.value

describe('rule: internal link status on the bounded fact document', () => {
  afterEach(() => vi.restoreAllMocks())

  it('reports the true page anchor total, not the bounded sample, as the total', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 200 }))
    const links = Array.from({ length: 300 }, (_, i) => `<a href="/p${i}">x</a>`).join('')
    const facts = collectDomFacts(makeDoc(`<html><head><title>T</title></head><body>${links}</body></html>`), 'static')
    expect(facts.truncatedBuckets).toContain('anchor')
    const doc = domFactsToDocument(facts, makeDoc)
    const r = await enrichResult(await rule.run(
      { html: '', url: 'https://example.com/', doc, staticFacts: facts } as never,
      { globals: {} },
    ), rule, 'test')
    expect(r.type).toBe('ok')
    expect(detail(r, 'Internal anchors')).toBe(300)
    // The message must not present the tiny bounded sample as the page total.
    expect(detail(r, 'Sampled from')).toContain('300 eligible internal link anchors')
  })

  it('still probes internal links when the first anchors are all nav/cross-host (orf.at shape)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 200 }))
    const nav = ['#top', '#nav', ...Array.from({ length: 8 }, (_, i) => `https://sub${i}.example.org/`)]
      .map((href) => `<a href="${href}">n</a>`).join('')
    const internal = Array.from({ length: 36 }, (_, i) => `<a href="/story${i}">s</a>`).join('')
    const source = makeDoc(`<html><head><title>T</title></head><body>${nav}${internal}</body></html>`)
    const facts = collectDomFacts(source, 'static')
    expect(facts.anchorCount).toBe(46)
    // The bounded anchor evidence still holds only the leading nav anchors...
    expect(facts.truncatedBuckets).toContain('anchor')
    // ...but candidates are picked across the COMPLETE DOM, so the nav bar
    // cannot starve the sample any more.
    expect(facts.internalLinkCount).toBe(36)
    expect(facts.internalLinkCandidates).toHaveLength(5)
    expect(facts.internalLinkCandidates?.every((c) => c.url.includes('/story'))).toBe(true)
    const doc = domFactsToDocument(facts, makeDoc)
    const r = await enrichResult(await rule.run(
      { html: '', url: source.URL, doc, staticFacts: facts } as never,
      { globals: {} },
    ), rule, 'test')
    expect(r.type).toBe('ok')
    expect(value(r, 'Links tested')).toBe(5)
    expect(detail(r, 'Internal anchors')).toBe(36)
    expect(detail(r, 'Sampled from')).toContain('36 eligible internal link anchors')
  })

  it('separates "no internal links" from "candidates did not fit the budget"', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 200 }))
    const doc = makeDoc('<html><head><title>T</title></head><body><p>x</p></body></html>')
    const empty = collectDomFacts(doc, 'static')
    const none = await enrichResult(await rule.run(
      { html: '', url: 'https://example.com/', doc, staticFacts: empty } as never, { globals: {} }), rule, 'test')
    expect(none.type).toBe('info'); expect(none.priority).toBe(900)
    expect(none.presentation?.input).toBe('Static DOM + Page URL')
    expect(value(none, 'Internal links found')).toBe(0)

    const squeezed = { ...empty, internalLinkCount: 12, internalLinkCandidatesOmitted: 12 }
    const cut = await enrichResult(await rule.run(
      { html: '', url: 'https://example.com/', doc, staticFacts: squeezed } as never, { globals: {} }), rule, 'test')
    expect(cut.type).toBe('runtime_error'); expect(cut.priority).toBe(900)
    expect(value(cut, 'Internal anchors')).toBe(12)
    expect(detail(cut, 'Candidates dropped')).toBe(12)
  })

  it('fails loudly instead of claiming "no internal links" when a payload carries no candidate list', async () => {
    // Facts produced before the candidate pass existed (or by a runtime that
    // could not run it) have only the bounded anchor evidence. On an
    // anchor-bearing page with truncated anchors that proves nothing, so the
    // rule must say it could not test - never "no internal links".
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 200 }))
    const doc = makeDoc('<html><head><title>T</title></head><body><p>x</p></body></html>')
    const facts = {
      ...collectDomFacts(doc, 'static'),
      anchorCount: 5,
      truncatedBuckets: ['anchor' as const],
      internalLinkCandidates: undefined,
      internalLinkCount: undefined,
    }
    const r = await enrichResult(await rule.run(
      { html: '', url: 'https://example.com/', doc, staticFacts: facts } as never,
      { globals: {} },
    ), rule, 'test')
    expect(r.type).toBe('runtime_error'); expect(r.priority).toBe(900)
    expect(r.presentation?.noMarkup).not.toContain('no internal links found to test')
    expect(r.presentation?.noMarkup).toContain("bounded DOM capture kept none of the page's anchors")
  })
})
