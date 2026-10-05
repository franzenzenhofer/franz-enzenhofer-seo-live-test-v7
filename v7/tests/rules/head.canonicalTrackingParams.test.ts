import { describe, expect, it } from 'vitest'

import { canonicalTrackingParamsRule as rule } from '@/rules/head/canonicalTrackingParams'

const run = (html: string, variables: Record<string, unknown> = {}) => rule.run({
  html, url: 'https://example.test/page', doc: new DOMParser().parseFromString(html, 'text/html'),
} as any, { globals: { variables } })

describe('canonical tracking params', () => {
  it('reports a missing canonical as information using only the static DOM', async () => {
    const r = await run('<p>Page</p>')
    expect(r.type).toBe('info')
    expect(r.priority).toBe(850)
    expect(r.presentation?.input).toBe('Static DOM')
    expect(r.presentation?.values).toContainEqual({ key: 'Canonical link', value: 'Not found', kind: 'text' })
    expect(r.presentation?.checked.some(({ key }) => key === 'Parameter names')).toBe(false)
  })

  it('retains an empty canonical link as observed source markup', async () => {
    const html = '<link rel="canonical" data-source="cms" href="">'
    const r = await run(html)
    expect(r.type).toBe('info')
    expect(r.presentation?.markup[0]?.value).toBe(html)
    expect(r.presentation?.values).toContainEqual({ key: 'Canonical link', value: 'Found without an href', kind: 'text' })
  })

  it('passes a canonical with no checked tracking parameters', async () => {
    const r = await run('<link rel="canonical" href="/page?ref=home">')
    expect(r.type).toBe('ok')
    expect(r.priority).toBe(800)
    expect(r.presentation?.input).toBe('Static DOM + Page URL')
    expect(r.presentation?.values).toContainEqual({ key: 'Canonical href', value: '/page?ref=home', kind: 'text' })
    expect(r.presentation?.values).toContainEqual({ key: 'Canonical URL', value: 'https://example.test/page?ref=home', kind: 'url' })
    expect(r.presentation?.values).toContainEqual({ key: 'Offending parameters', value: 'None', kind: 'text' })
    expect(r.presentation?.evidence).toEqual([expect.objectContaining({ name: '<link rel="canonical">' })])
    expect(r.presentation?.detailValues).toContainEqual({ key: 'Markup retained', value: 1, kind: 'text' })
    expect(r.presentation?.checked.find(({ key }) => key === 'Parameter names')).toBeDefined()
  })

  it('warns for built-in and configured tracking parameters', async () => {
    const r = await run('<link rel="canonical" href="https://example.test/page?utm_source=newsletter&gclid=123&campaign_id=9">', {
      canonicalTrackingParamsExtra: ['campaign_id'],
    })
    expect(r.type).toBe('warn')
    expect(r.priority).toBe(180)
    expect(r.presentation?.values).toContainEqual({ key: 'Offending parameters', value: 'utm_source, gclid, campaign_id', kind: 'text' })
  })

  it('warns for non-HTTP schemes without turning them into clickable URL fields', async () => {
    const html = '<link rel="canonical" href="javascript:alert(1)">'
    const r = await run(html)
    expect(r.type).toBe('warn')
    expect(r.priority).toBe(200)
    expect(r.presentation?.values).toContainEqual({ key: 'Canonical href', value: 'javascript:alert(1)', kind: 'text' })
    expect(r.presentation?.values).toContainEqual({ key: 'URL scheme', value: 'javascript:', kind: 'text' })
    expect(r.presentation?.values.some(({ kind }) => kind === 'url')).toBe(false)
  })

  it('warns on an invalid canonical URL and preserves the raw href', async () => {
    const html = '<link rel="canonical" href="http://[">'
    const r = await run(html)
    expect(r.type).toBe('warn')
    expect(r.priority).toBe(200)
    expect(r.presentation?.values).toContainEqual({ key: 'Canonical href', value: 'http://[', kind: 'text' })
    expect(r.presentation?.values).toContainEqual({ key: 'Canonical URL', value: 'Invalid URL', kind: 'text' })
    expect(r.presentation?.values).toContainEqual({ key: '<link rel="canonical">', value: html, kind: 'original', fidelity: 'complete-original' })
  })

  it('preserves references, userGuide and removes the legacy details payload', async () => {
    const r = await run('<link rel="canonical" href="https://example.test/page">')
    expect(r.presentation?.references).toEqual(rule.meta.references)
    expect(rule.meta.userGuide?.action).toContain('tracking parameters')
    expect(r.details).toBeUndefined()
  })
})
