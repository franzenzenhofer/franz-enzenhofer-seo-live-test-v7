import { describe, expect, it } from 'vitest'

import { canonicalRule as rule } from '@/rules/head/canonical'

const run = (html: string, url = 'https://example.test/a') => rule.run({
  html, url, doc: new DOMParser().parseFromString(html, 'text/html'),
} as any, { globals: {} })

describe('rules: canonical', () => {
  it('warns when no canonical link exists', async () => {
    const r = await run('<p>Page</p>')
    expect(r.type).toBe('warn')
    expect(r.priority).toBe(400)
    expect(r.presentation?.values).toContainEqual({ key: 'Canonical links', value: 0, kind: 'text' })
    expect(r.presentation?.noMarkup).toBe('No matching canonical link element found')
    expect(r.details).toBeUndefined()
  })

  it('errors for multiple links and retains every sampled href and source tag', async () => {
    const html = '<link rel="canonical" href="/one"><link rel="canonical" href="https://example.test/two">'
    const r = await run(html)
    expect(r.type).toBe('error')
    expect(r.priority).toBe(200)
    expect(r.presentation?.values).toContainEqual({ key: 'Canonical links', value: 2, kind: 'text' })
    expect(r.presentation?.values).toContainEqual({ key: 'Canonical href 1', value: '/one', kind: 'text' })
    expect(r.presentation?.values).toContainEqual({ key: 'Canonical href 2', value: 'https://example.test/two', kind: 'url' })
    expect(r.presentation?.markup.map(({ value }) => value).join('')).toBe(html)
  })

  it('warns when the sole canonical is outside head', async () => {
    const r = await run('<body><link rel="canonical" href="https://example.test/a"></body>')
    expect(r.type).toBe('warn')
    expect(r.priority).toBe(250)
    expect(r.presentation?.detailValues).toContainEqual({ key: 'Placement', value: 'Outside head', kind: 'text' })
  })

  it('warns when the sole canonical has an empty href', async () => {
    const r = await run('<link rel="canonical" href="">')
    expect(r.type).toBe('warn')
    expect(r.priority).toBe(300)
    expect(r.presentation?.values).toContainEqual({ key: 'Canonical href (observed)', value: 'Empty', kind: 'text' })
    expect(r.presentation?.markup[0]?.value).toBe('<link rel="canonical" href="">')
  })

  it('warns when canonical contains a fragment', async () => {
    const r = await run('<head><link rel="canonical" href="https://example.test/a#section"></head>')
    expect(r.type).toBe('warn')
    expect(r.priority).toBe(250)
    expect(r.presentation?.detailValues).toContainEqual({ key: 'Fragment', value: 'Present', kind: 'text' })
  })

  it('warns on an invalid canonical URL', async () => {
    const r = await run('<link rel="canonical" href="http://[">')
    expect(r.type).toBe('warn')
    expect(r.priority).toBe(150)
    expect(r.presentation?.values).toContainEqual({ key: 'URL status', value: 'Invalid URL', kind: 'text' })
  })

  it('warns on a relative canonical and reports the resolved URL', async () => {
    const r = await run('<link rel="canonical" href="/b">')
    expect(r.type).toBe('warn')
    expect(r.priority).toBe(300)
    expect(r.presentation?.values).toContainEqual({ key: 'Absolute URL', value: 'No', kind: 'text' })
    expect(r.presentation?.values).toContainEqual({ key: 'Resolved canonical URL', value: 'https://example.test/b', kind: 'url' })
  })

  it('warns when canonical points elsewhere', async () => {
    const r = await run('<link rel="canonical" href="https://example.test/c">')
    expect(r.type).toBe('warn')
    expect(r.priority).toBe(500)
    expect(r.presentation?.values).toContainEqual({ key: 'Self-reference', value: 'No', kind: 'text' })
  })

  it('keeps the query string when detecting self-reference (different params are not self)', async () => {
    const r = await run('<link rel="canonical" href="https://example.test/products?category=hats">', 'https://example.test/products?category=shoes')
    expect(r.type).toBe('warn')
    expect(r.presentation?.values).toContainEqual({ key: 'Self-reference', value: 'No', kind: 'text' })
  })

  it('self-references when the query string is identical', async () => {
    const r = await run('<link rel="canonical" href="https://example.test/products?category=shoes">', 'https://example.test/products?category=shoes')
    expect(r.type).toBe('ok')
    expect(r.priority).toBe(850)
    expect(r.presentation?.values).toContainEqual({ key: 'Self-reference', value: 'Yes', kind: 'text' })
  })

  it('preserves references and removes legacy details', async () => {
    const r = await run('<link rel="canonical" href="https://example.test/a">')
    expect(r.presentation?.references).toEqual(rule.meta.references)
    expect(r.details).toBeUndefined()
  })
})
