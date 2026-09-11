import { describe, expect, it } from 'vitest'

import { canonicalNavConsistencyRule as rule } from '@/rules/head/canonicalNavConsistency'

const run = (html: string, trace?: Array<{ url: string; type: string }>, extra: Record<string, unknown> = {}) => rule.run({
  html, url: 'https://example.test/final', doc: new DOMParser().parseFromString(html, 'text/html'), ...extra,
} as any, { globals: trace ? { navigationLedger: { trace } } : {} })

describe('canonical versus navigation', () => {
  it('reports a missing canonical as information using only the static DOM', async () => {
    const r = await run('<p>Page</p>')
    expect(r.type).toBe('info')
    expect(r.priority).toBe(900)
    expect(r.presentation?.input).toBe('Static DOM')
    expect(r.presentation?.values).toContainEqual({ key: 'Canonical link', value: 'Not found', kind: 'text' })
  })

  it('warns on an invalid canonical URL and retains the source markup', async () => {
    const html = '<link rel="canonical" data-source="cms" href="http://[">'
    const r = await run(html)
    expect(r.type).toBe('warn')
    expect(r.priority).toBe(200)
    expect(r.presentation?.input).toBe('Static DOM + Page URL')
    expect(r.presentation?.values).toContainEqual({ key: 'URL status', value: 'Invalid URL', kind: 'text' })
    expect(r.presentation?.markup[0]?.value).toBe(html)
  })

  it('aligns with the final URL without redirects', async () => {
    const r = await run('<link rel="canonical" href="https://example.test/final">', [
      { url: 'https://example.test/final', type: 'load' },
    ])
    expect(r.type).toBe('ok')
    expect(r.priority).toBe(850)
    expect(r.presentation?.input).toBe('Static DOM + Page URL + Navigation events')
    expect(r.presentation?.values).toContainEqual({ key: 'Navigation comparison', value: 'Aligns with final URL', kind: 'text' })
  })

  it('warns when canonical equals the first URL that redirected, with bounded per-hop evidence', async () => {
    const r = await run('<link rel="canonical" href="https://example.test/start">', [
      { url: 'https://example.test/start', type: 'load' },
      { url: 'https://example.test/final', type: 'http_redirect' },
    ])
    expect(r.type).toBe('warn')
    expect(r.priority).toBe(180)
    expect(r.presentation?.values).toContainEqual({ key: 'Navigation comparison', value: 'Equals a URL that redirected', kind: 'text' })
    expect(r.presentation?.values).toContainEqual({ key: 'Redirect count', value: 1, kind: 'text' })
    expect(r.presentation?.evidence).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'Navigation hop 1' }), expect.objectContaining({ name: 'Navigation hop 2' }),
    ]))
  })

  it('reports a different preferred URL as information', async () => {
    const r = await run('<link rel="canonical" href="https://example.test/other">', [
      { url: 'https://example.test/final', type: 'load' },
    ])
    expect(r.type).toBe('info')
    expect(r.priority).toBe(600)
    expect(r.presentation?.values).toContainEqual({ key: 'Navigation comparison', value: 'Points to a different URL than the final URL', kind: 'text' })
  })

  it('aligns with the final URL after a redirect using the fallback ok priority', async () => {
    const r = await run('<link rel="canonical" href="https://example.test/final">', [
      { url: 'https://example.test/start', type: 'load' },
      { url: 'https://example.test/final', type: 'http_redirect' },
    ])
    expect(r.type).toBe('ok')
    expect(r.priority).toBe(800)
    expect(r.presentation?.values).toContainEqual({ key: 'Navigation comparison', value: 'Aligns with navigation', kind: 'text' })
  })

  it('reports no Navigation events input when neither ledger nor header chain was captured', async () => {
    const r = await run('<link rel="canonical" href="https://example.test/final">')
    expect(r.presentation?.input).toBe('Static DOM + Page URL')
  })

  it('preserves references and removes the legacy details payload', async () => {
    const r = await run('<link rel="canonical" href="https://example.test/final">', [
      { url: 'https://example.test/final', type: 'load' },
    ])
    expect(r.presentation?.references).toEqual(rule.meta.references)
    expect(r.details).toBeUndefined()
  })
})
