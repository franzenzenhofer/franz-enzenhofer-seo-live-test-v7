import { describe, expect, it } from 'vitest'

import { canonicalHreflangConsistencyRule as rule } from '@/rules/head/canonicalHreflangConsistency'
import { markReconstructed } from '@/shared/presentation/originalMarkup'

const run = (html: string, url = 'https://example.test/page') => rule.run({
  html, url, doc: new DOMParser().parseFromString(html, 'text/html'),
} as any, { globals: {} })

describe('canonical hreflang consistency', () => {
  it('reports a missing canonical as information without evaluating hreflang links', async () => {
    const r = await run('<link rel="alternate" hreflang="en" href="https://example.test/page">')
    expect(r.type).toBe('info')
    expect(r.priority).toBe(900)
    expect(r.presentation?.input).toBe('Static DOM')
    expect(r.presentation?.values).toContainEqual({ key: 'Canonical link', value: 'Not found', kind: 'text' })
  })

  it('reports a canonical without hreflang links as information and retains markup', async () => {
    const html = '<link rel="canonical" data-source="cms" href="https://example.test/page">'
    const r = await run(html)
    expect(r.type).toBe('info')
    expect(r.priority).toBe(850)
    expect(r.presentation?.values).toContainEqual({ key: 'Hreflang links', value: 0, kind: 'text' })
    expect(r.presentation?.markup[0]?.value).toBe(html)
  })

  it('warns on an invalid canonical while retaining raw source and references', async () => {
    const html = '<link rel="canonical" href="http://["><link rel="alternate" hreflang="en" href="https://example.test/page">'
    const r = await run(html)
    expect(r.type).toBe('warn')
    expect(r.priority).toBe(200)
    expect(r.presentation?.input).toBe('Static DOM + Page URL')
    expect(r.presentation?.values).toContainEqual({ key: 'Canonical href (observed)', value: 'http://[', kind: 'text' })
    expect(r.presentation?.references).toEqual(rule.meta.references)
    expect(r.details).toBeUndefined()
  })

  it('warns when the canonical is absent from the hreflang cluster', async () => {
    const r = await run('<link rel="canonical" href="https://example.test/page"><link rel="alternate" hreflang="de" href="https://example.test/de/page">')
    expect(r.type).toBe('warn')
    expect(r.priority).toBe(180)
    expect(r.presentation?.values).toContainEqual({ key: 'Canonical in cluster', value: 'Not found', kind: 'text' })
    expect(r.presentation?.values).toContainEqual({ key: 'Non-HTTPS alternates', value: 0, kind: 'text' })
  })

  it('labels a non-HTTPS scheme alternate as "Non-HTTPS alternates", never "HTTP", and retains mismatch evidence first', async () => {
    const html = '<link rel="canonical" href="https://example.test/page"><link rel="alternate" hreflang="en" href="https://example.test/page"><link rel="alternate" hreflang="de" href="http://example.test/de/page">'
    const r = await run(html)
    expect(r.type).toBe('warn')
    expect(r.presentation?.values).toContainEqual({ key: 'Non-HTTPS alternates', value: 1, kind: 'text' })
    expect(r.presentation?.values.some(({ key }) => key === 'HTTP mismatches')).toBe(false)
    expect(r.presentation?.evidence).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'Non-HTTPS alternate 1', fields: expect.arrayContaining([
        { key: 'Resolved URL', value: 'http://example.test/de/page', kind: 'url' },
      ]) }),
    ]))
  })

  it('accepts aligned cross-domain alternates and normalized canonical URLs (fragment ignored)', async () => {
    const html = '<link rel="canonical" href="https://example.test/page#section"><link rel="alternate" hreflang="en" href="https://example.test/page"><link rel="alternate" hreflang="de" href="https://example.de/page">'
    const r = await run(html)
    expect(r.type).toBe('ok')
    expect(r.priority).toBe(820)
    expect(r.presentation?.values).toContainEqual({ key: 'Canonical in cluster', value: 'Found', kind: 'text' })
  })

  it('does not duplicate retained/omitted counts between evidence and detailValues', async () => {
    const r = await run('<link rel="canonical" href="https://example.test/page"><link rel="alternate" hreflang="en" href="https://example.test/page">')
    const captureRecord = r.presentation?.evidence.find(({ name }) => name === 'Capture')
    expect(captureRecord?.fields.some(({ key }) => key === 'Hreflang elements retained')).toBe(false)
    expect(r.presentation?.detailValues).toContainEqual({ key: 'Hreflang elements retained', value: 1, kind: 'text' })
  })

  it('prioritizes offending alternates in the retained markup sample when more than 10 exist', async () => {
    const goodAlternates = Array.from({ length: 10 }, (_, index) => `<link rel="alternate" hreflang="x-${index}" href="https://example.test/page">`).join('')
    const html = `<link rel="canonical" href="https://example.test/page">${goodAlternates}<link rel="alternate" hreflang="bad" href="http://example.test/bad">`
    const r = await run(html)
    expect(r.type).toBe('warn')
    expect(r.presentation?.values).toContainEqual({ key: 'Non-HTTPS alternates', value: 1, kind: 'text' })
    // The offending 11th element is retained despite the 10-element cap.
    expect(r.presentation?.markup.map(({ value }) => value).some((value) => value.includes('hreflang="bad"'))).toBe(true)
    expect(r.presentation?.detailValues).toContainEqual({ key: 'Hreflang elements omitted', value: 1, kind: 'text' })
  })

  it('distinguishes an empty canonical href from a missing href attribute', async () => {
    expect((await run('<link rel="canonical" href=" ">')).presentation?.values).toContainEqual({ key: 'Canonical link', value: 'Found with an empty href', kind: 'text' })
    expect((await run('<link rel="canonical">')).presentation?.values).toContainEqual({ key: 'Canonical link', value: 'Found without an href attribute', kind: 'text' })
  })

  it('never reports a DOM path generated inside a reconstructed fact document', async () => {
    const html = '<link rel="canonical" href="https://example.test/page"><link rel="alternate" hreflang="de" href="http://example.test/de/page">'
    const doc = new DOMParser().parseFromString(html, 'text/html')
    markReconstructed(doc)
    const r = await rule.run({ html, url: 'https://example.test/page', doc } as any, { globals: {} })
    expect(r.presentation?.evidence.find(({ name }) => name === 'Non-HTTPS alternate 1')?.fields).toContainEqual({ key: 'DOM path', value: 'Not captured', kind: 'text' })
  })
})
