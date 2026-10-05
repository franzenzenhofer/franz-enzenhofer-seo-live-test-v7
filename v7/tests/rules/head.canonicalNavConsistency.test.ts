import { describe, expect, it } from 'vitest'

import { canonicalNavConsistencyRule as rule } from '@/rules/head/canonicalNavConsistency'

const run = (html: string, trace?: Array<{ url: string; type: string }>, extra: Record<string, unknown> = {}) => rule.run({
  html, url: 'https://example.test/final', doc: new DOMParser().parseFromString(html, 'text/html'), ...extra,
} as any, { globals: trace ? { navigationLedger: { trace } } : {} })
const keys = (r: Awaited<ReturnType<typeof run>>) => r.presentation?.values.map(({ key }) => key)
const detail = (r: Awaited<ReturnType<typeof run>>, key: string) => r.presentation?.detailValues.find((field) => field.key === key)?.value

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
    expect(r.presentation?.values).toContainEqual({ key: 'Canonical href', value: 'http://[', kind: 'text' })
    expect(r.presentation?.values).toContainEqual({ key: 'Canonical URL', value: 'Invalid URL', kind: 'text' })
    expect(r.presentation?.values).toContainEqual({ key: '<link rel="canonical">', value: html, kind: 'original', fidelity: 'complete-original' })
  })

  it('aligns with the final URL without redirects: both URLs, the verdict, then the markup', async () => {
    const html = '<link rel="canonical" href="https://example.test/final">'
    const r = await run(html, [{ url: 'https://example.test/final', type: 'load' }])
    expect(r.type).toBe('ok')
    expect(r.priority).toBe(850)
    expect(r.presentation?.input).toBe('Static DOM + Page URL + Navigation events')
    expect(r.presentation?.values).toEqual([
      { key: 'Canonical URL', value: 'https://example.test/final', kind: 'url' },
      { key: 'Final URL', value: 'https://example.test/final', kind: 'url' },
      { key: 'Comparison', value: 'Equals final URL', kind: 'text' },
      { key: '<link rel="canonical">', value: html, kind: 'original', fidelity: 'complete-original' },
    ])
    expect(detail(r, 'Redirects')).toBe(0)
    expect(detail(r, 'Navigation hops')).toBe(1)
  })

  it('warns when canonical equals the first URL that redirected, showing first and final URL', async () => {
    const r = await run('<link rel="canonical" href="https://example.test/start">', [
      { url: 'https://example.test/start', type: 'load' },
      { url: 'https://example.test/final', type: 'http_redirect' },
    ])
    expect(r.type).toBe('warn')
    expect(r.priority).toBe(180)
    expect(keys(r)).toEqual(['Canonical URL', 'First URL', 'Final URL', 'Comparison', '<link rel="canonical">'])
    expect(r.presentation?.values).toContainEqual({ key: 'First URL', value: 'https://example.test/start', kind: 'url' })
    expect(r.presentation?.values).toContainEqual({ key: 'Comparison', value: 'Equals first URL (redirected)', kind: 'text' })
    expect(detail(r, 'Redirects')).toBe(1)
    expect(r.presentation?.evidence).toEqual([expect.objectContaining({ name: '<link rel="canonical">' })])
  })

  it('reports a different preferred URL as information naming the differing component', async () => {
    const r = await run('<link rel="canonical" href="https://example.test/other">', [
      { url: 'https://example.test/final', type: 'load' },
    ])
    expect(r.type).toBe('info')
    expect(r.priority).toBe(600)
    expect(r.presentation?.values).toContainEqual({ key: 'Comparison', value: 'Differs from final URL (path)', kind: 'text' })
  })

  it('aligns with the final URL after a redirect using the fallback ok priority', async () => {
    const r = await run('<link rel="canonical" href="https://example.test/final">', [
      { url: 'https://example.test/start', type: 'load' },
      { url: 'https://example.test/final', type: 'http_redirect' },
    ])
    expect(r.type).toBe('ok')
    expect(r.priority).toBe(800)
    expect(r.presentation?.values).toContainEqual({ key: 'Comparison', value: 'Equals final URL', kind: 'text' })
  })

  it('states the main-document status chain from captured redirect events as one fact', async () => {
    const r = await run('<link rel="canonical" href="https://example.test/final">', undefined, {
      headerChain: [{ url: 'https://example.test/start', status: 301, location: 'https://example.test/final' }, { url: 'https://example.test/final', status: 200 }],
    })
    expect(r.presentation?.input).toBe('Static DOM + Page URL + Navigation events')
    expect(detail(r, 'Redirect hops')).toBe(2)
    expect(detail(r, 'Status chain')).toBe('301 > 200')
    expect(r.presentation?.detailValues.every((field) => field.kind !== 'text' || !/https?:\/\//.test(String(field.value)))).toBe(true)
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
