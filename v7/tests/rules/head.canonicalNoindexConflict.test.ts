import { describe, expect, it } from 'vitest'

import { canonicalNoindexConflictRule } from '@/rules/head/canonicalNoindexConflict'

const doc = (h: string) => new DOMParser().parseFromString(h, 'text/html')
const run = (html: string, extra: Record<string, unknown> = {}) => canonicalNoindexConflictRule.run(
  { html: '', url: 'https://ex.com/page', doc: doc(html), ...extra } as any,
  { globals: {} } as any,
)
const fields = (result: any) => result.presentation.values as Array<{ key: string; value: string | number }>

describe('rule: canonical + noindex conflict', () => {
  it('reports no conflict when only the canonical is present', async () => {
    const res = await run('<link rel="canonical" href="https://ex.com/page">')
    expect(res.type).toBe('info')
    expect(res.priority).toBe(900)
    expect(res.presentation.version).toBe(1)
    expect(res.presentation.input).toBe('Static DOM')
    expect(fields(res)).toEqual(expect.arrayContaining([
      { key: 'Canonical sources', value: 1, kind: 'text' },
      { key: 'Noindex', value: 'Not observed in checked input', kind: 'text' },
      { key: 'Conflict', value: 'Not detected', kind: 'text' },
    ]))
  })

  it('warns when a robots meta noindex coexists with an HTML canonical', async () => {
    const res = await run('<link rel="canonical" href="https://ex.com/page"><meta name="robots" content="noindex">')
    expect(res.type).toBe('warn')
    expect(res.priority).toBe(160)
    expect(res.message).toContain('Noindex: Observed')
    expect(res.presentation.markup).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'original', value: '<link rel="canonical" href="https://ex.com/page">', fidelity: 'complete-original' }),
      expect.objectContaining({ kind: 'original', value: '<meta name="robots" content="noindex">', fidelity: 'complete-original' }),
    ]))
    expect(res.presentation.evidence.some((entry: any) => entry.name === 'Applicable instruction 1')).toBe(true)
  })

  it('keeps case-insensitive robots and googlebot noindex semantics', async () => {
    const robots = await run('<link rel="canonical" href="https://ex.com/page"><meta name="Robots" content="noindex">')
    const googlebot = await run('<link rel="canonical" href="https://ex.com/page"><meta name="googlebot" content="none">')
    expect(robots.type).toBe('warn')
    expect(googlebot.type).toBe('warn')
    expect(googlebot.presentation.values).toEqual(expect.arrayContaining([
      expect.objectContaining({ key: 'Noindex meta', value: 'Observed' }),
    ]))
  })

  it('warns when HTTP canonical and X-Robots-Tag noindex are checked', async () => {
    const res = await run('<p></p>', {
      headers: { link: '<https://ex.com/page>; rel="canonical"', 'x-robots-tag': 'noindex' },
    })
    expect(res.type).toBe('warn')
    expect(res.presentation.input).toBe('Static DOM + HTTP response headers')
    expect(fields(res)).toEqual(expect.arrayContaining([
      { key: 'Canonical sources', value: 1, kind: 'text' },
      { key: 'HTTP canonical 1', value: 'https://ex.com/page', kind: 'url' },
      { key: 'Noindex header', value: 'Observed', kind: 'text' },
    ]))
    expect(res.presentation.evidence).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'Canonical sources', fields: expect.arrayContaining([
        expect.objectContaining({ key: 'HTTP Link header', value: '<https://ex.com/page>; rel="canonical"' }),
      ]) }),
      expect.objectContaining({ name: 'Robots sources', fields: expect.arrayContaining([
        expect.objectContaining({ key: 'X-Robots-Tag header', value: 'noindex' }),
      ]) }),
    ]))
  })

  it('does not turn an unparseable HTTP Link header target into a clickable URL field', async () => {
    const res = await run('<p></p>', {
      headers: { link: '<not a real url>; rel="canonical"' },
    })
    expect(fields(res)).toContainEqual({ key: 'HTTP canonical 1', value: 'not a real url', kind: 'text' })
  })

  it('uses response header fields for effective noindex', async () => {
    const res = await run('<link rel="canonical" href="https://ex.com/page">', {
      responseHeaderFields: [['X-Robots-Tag', 'googlebot: noindex']],
    })
    expect(res.type).toBe('warn')
    expect(res.presentation.input).toBe('Static DOM + HTTP response headers')
    expect(fields(res)).toEqual(expect.arrayContaining([
      { key: 'Noindex header', value: 'Observed', kind: 'text' },
    ]))
    expect(res.presentation.evidence.find((entry: any) => entry.name === 'Robots sources').fields).toContainEqual({ key: 'X-Robots-Tag header', value: 'Not captured', kind: 'text' })
  })

  it('warns on a user-agent-scoped X-Robots-Tag noindex in the headers map', async () => {
    const res = await run('<link rel="canonical" href="https://ex.com/page">', { headers: { 'x-robots-tag': 'googlebot: noindex' } })
    expect(res.type).toBe('warn')
    expect(res.priority).toBe(160)
  })

  it('reports noindex without a canonical as no conflict', async () => {
    const res = await run('<meta name="robots" content="noindex">')
    expect(res.type).toBe('info')
    expect(fields(res)).toEqual(expect.arrayContaining([
      { key: 'Canonical sources', value: 0, kind: 'text' },
      { key: 'Noindex', value: 'Observed', kind: 'text' },
      { key: 'Conflict', value: 'Not detected', kind: 'text' },
    ]))
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
