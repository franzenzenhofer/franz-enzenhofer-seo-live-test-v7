import { describe, expect, it } from 'vitest'

import { canonicalNoindexConflictRule } from '@/rules/head/canonicalNoindexConflict'

const doc = (h: string) => new DOMParser().parseFromString(h, 'text/html')
const run = (html: string, extra: Record<string, unknown> = {}) => canonicalNoindexConflictRule.run(
  { html: '', url: 'https://ex.com/page', doc: doc(html), ...extra } as any,
  { globals: {} } as any,
)
const fields = (result: any) => result.presentation.values as Array<{ key: string; value: string | number }>
const details = (result: any) => result.presentation.detailValues as Array<{ key: string; value: string | number }>

describe('rule: canonical + noindex conflict', () => {
  it('reports no conflict when only the canonical is present: the URL, noindex not found, the markup', async () => {
    const res = await run('<link rel="canonical" href="https://ex.com/page">')
    expect(res.type).toBe('info')
    expect(res.priority).toBe(900)
    expect(res.presentation.version).toBe(1)
    expect(res.presentation.input).toBe('Static DOM')
    expect(fields(res)).toEqual([
      { key: 'Canonical URL', value: 'https://ex.com/page', kind: 'url' },
      { key: 'noindex', value: 'Not found', kind: 'text' },
      { key: '<link rel="canonical">', value: '<link rel="canonical" href="https://ex.com/page">', kind: 'original', fidelity: 'complete-original' },
    ])
    expect(details(res).some(({ key }) => key.startsWith('X-Robots-Tag'))).toBe(false)
  })

  it('warns when a robots meta noindex coexists with an HTML canonical and names the source', async () => {
    const res = await run('<link rel="canonical" href="https://ex.com/page"><meta name="robots" content="noindex">')
    expect(res.type).toBe('warn')
    expect(res.priority).toBe(160)
    expect(res.message).toContain('noindex: meta robots')
    expect(res.presentation.markup).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'original', value: '<link rel="canonical" href="https://ex.com/page">', fidelity: 'complete-original' }),
      expect.objectContaining({ kind: 'original', value: '<meta name="robots" content="noindex">', fidelity: 'complete-original' }),
    ]))
    expect(res.presentation.evidence.map((entry: any) => entry.name)).toEqual(['<link rel="canonical">', '<meta name="robots">'])
    expect(res.presentation.evidence[1].fields).toContainEqual({ key: 'content', value: 'noindex', kind: 'text' })
    expect(details(res)).toContainEqual({ key: 'meta robots', value: 'noindex', kind: 'text' })
  })

  it('keeps case-insensitive robots and googlebot noindex semantics', async () => {
    const robots = await run('<link rel="canonical" href="https://ex.com/page"><meta name="Robots" content="noindex">')
    const googlebot = await run('<link rel="canonical" href="https://ex.com/page"><meta name="googlebot" content="none">')
    expect(robots.type).toBe('warn')
    expect(googlebot.type).toBe('warn')
    expect(fields(googlebot)).toContainEqual({ key: 'noindex', value: 'meta googlebot', kind: 'text' })
    expect(details(googlebot)).toContainEqual({ key: 'meta googlebot', value: 'none', kind: 'text' })
  })

  it('warns when HTTP canonical and X-Robots-Tag noindex are checked', async () => {
    const res = await run('<p></p>', {
      headers: { link: '<https://ex.com/page>; rel="canonical"', 'x-robots-tag': 'noindex' },
    })
    expect(res.type).toBe('warn')
    expect(res.presentation.input).toBe('Static DOM + HTTP response headers')
    expect(fields(res)).toEqual([
      { key: 'HTTP canonical', value: 'https://ex.com/page', kind: 'url' },
      { key: 'noindex', value: 'X-Robots-Tag', kind: 'text' },
    ])
    expect(details(res)).toEqual([{ key: 'X-Robots-Tag', value: 'noindex', kind: 'text' }])
    expect(res.presentation.evidence).toEqual([])
  })

  it('does not turn an unparseable HTTP Link header target into a clickable URL field', async () => {
    const res = await run('<p></p>', {
      headers: { link: '<not a real url>; rel="canonical"' },
    })
    expect(fields(res)).toContainEqual({ key: 'HTTP canonical', value: 'not a real url', kind: 'text' })
  })

  it('uses response header fields for effective noindex', async () => {
    const res = await run('<link rel="canonical" href="https://ex.com/page">', {
      responseHeaderFields: [['X-Robots-Tag', 'googlebot: noindex']],
    })
    expect(res.type).toBe('warn')
    expect(res.presentation.input).toBe('Static DOM + HTTP response headers')
    expect(fields(res)).toContainEqual({ key: 'noindex', value: 'X-Robots-Tag googlebot', kind: 'text' })
    expect(details(res)).toContainEqual({ key: 'X-Robots-Tag googlebot', value: 'noindex', kind: 'text' })
  })

  it('warns on a user-agent-scoped X-Robots-Tag noindex in the headers map', async () => {
    const res = await run('<link rel="canonical" href="https://ex.com/page">', { headers: { 'x-robots-tag': 'googlebot: noindex' } })
    expect(res.type).toBe('warn')
    expect(res.priority).toBe(160)
  })

  it('reports noindex without a canonical as no conflict', async () => {
    const res = await run('<meta name="robots" content="noindex">')
    expect(res.type).toBe('info')
    expect(fields(res)).toEqual([
      { key: 'Canonical', value: 'Not found', kind: 'text' },
      { key: 'noindex', value: 'meta robots', kind: 'text' },
      { key: '<meta name="robots">', value: '<meta name="robots" content="noindex">', kind: 'original', fidelity: 'complete-original' },
    ])
  })

  it('retains references, checked criteria, and avoids legacy detail objects', async () => {
    const res = await run('<link rel="canonical" href="https://ex.com/page">')
    expect(res.presentation.references).toEqual([
      'https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls',
      'https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag',
    ])
    expect(res.presentation.checked).toEqual(expect.arrayContaining([
      expect.objectContaining({ key: 'Canonical selector' }),
      expect.objectContaining({ key: 'Criterion' }),
    ]))
    expect(res.details).toBeUndefined()
  })
})
