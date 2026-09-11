import { describe, expect, it } from 'vitest'

import { canonicalHttpsPreferenceRule as rule } from '@/rules/head/canonicalHttpsPreference'

const run = (html: string, url = 'https://example.test/page') => rule.run({
  html, url, doc: new DOMParser().parseFromString(html, 'text/html'),
} as any, { globals: {} })

describe('canonical HTTPS preference', () => {
  it('reports a missing canonical element as information using only the static DOM', async () => {
    const r = await run('<p>Page</p>')
    expect(r.type).toBe('info')
    expect(r.priority).toBe(900)
    expect(r.presentation?.input).toBe('Static DOM')
    expect(r.presentation?.values).toContainEqual({ key: 'Canonical link', value: 'Not found', kind: 'text' })
    expect(r.presentation?.noMarkup).toBe('No canonical link element found')
  })

  it('distinguishes a missing href attribute from a present but empty href', async () => {
    const missingAttr = await run('<link rel="canonical">')
    const emptyHref = await run('<link rel="canonical" href="">')
    expect(missingAttr.presentation?.values).toContainEqual({ key: 'Canonical link', value: 'Present, href attribute missing', kind: 'text' })
    expect(emptyHref.presentation?.values).toContainEqual({ key: 'Canonical link', value: 'Present, href empty', kind: 'text' })
    expect(emptyHref.presentation?.markup[0]?.value).toBe('<link rel="canonical" href="">')
  })

  it('retains the declared <base> element used to resolve a relative href', async () => {
    const html = '<base href="https://cdn.example.test/"><link rel="canonical" href="page">'
    const r = await run(html)
    expect(r.type).toBe('ok')
    expect(r.presentation?.values).toContainEqual({ key: 'Canonical URL', value: 'https://cdn.example.test/page', kind: 'url' })
    expect(r.presentation?.evidence).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'Base element' })]))
    expect(r.presentation?.markup.map(({ value }) => value)).toContain('<base href="https://cdn.example.test/">')
  })

  it('errors for an HTTPS page whose canonical resolves to HTTP', async () => {
    const html = '<link rel="canonical" href="http://example.test/page">'
    const r = await run(html)
    expect(r.type).toBe('error')
    expect(r.priority).toBe(120)
    expect(r.presentation?.input).toBe('Static DOM + Page URL')
    expect(r.presentation?.values).toContainEqual({ key: 'Canonical URL', value: 'http://example.test/page', kind: 'url' })
    expect(r.presentation?.values).toContainEqual({ key: 'HTTPS downgrade', value: 'Detected', kind: 'text' })
  })

  it('accepts an HTTPS canonical and resolves relative hrefs against the page URL', async () => {
    const r = await run('<link rel="canonical" href="/page">')
    expect(r.type).toBe('ok')
    expect(r.priority).toBe(800)
    expect(r.presentation?.values).toContainEqual({ key: 'Canonical URL', value: 'https://example.test/page', kind: 'url' })
    expect(r.presentation?.values).toContainEqual({ key: 'HTTPS downgrade', value: 'Not detected', kind: 'text' })
  })

  it('keeps an invalid declared href as plain text, never a broken link', async () => {
    const r = await run('<link rel="canonical" href="javascript:void(0)">')
    expect(r.type).toBe('warn')
    expect(r.presentation?.values).toContainEqual({ key: 'Canonical href (observed)', value: 'javascript:void(0)', kind: 'text' })
  })

  it('preserves the documentation reference, userGuide and removes legacy details', async () => {
    const r = await run('<link rel="canonical" href="https://example.test/page">')
    expect(r.presentation?.references).toEqual(rule.meta.references)
    expect(rule.meta.userGuide?.check).toContain('HTTPS')
    expect(r.details).toBeUndefined()
  })
})
