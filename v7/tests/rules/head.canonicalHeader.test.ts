import { describe, expect, it } from 'vitest'

import { canonicalHeaderRule as rule } from '@/rules/head/canonicalHeader'

const run = (headers?: Record<string, string>) => rule.run({
  html: '', url: 'https://example.test/', doc: new DOMParser().parseFromString('<p>Page</p>', 'text/html'), headers,
} as any, { globals: {} })

describe('canonical HTTP header', () => {
  it('reports headers not captured factually, not as a confirmed absence', async () => {
    const r = await run(undefined)
    expect(r.type).toBe('info')
    expect(r.priority).toBe(600)
    expect(r.presentation?.input).toBe('Not captured')
    expect(r.presentation?.values).toEqual([{ key: 'HTTP canonical', value: 'Not captured', kind: 'text' }])
  })

  it('reports a captured but empty Link header as absent', async () => {
    const r = await run({})
    expect(r.type).toBe('info')
    expect(r.priority).toBe(600)
    expect(r.presentation?.input).toBe('HTTP response headers')
    expect(r.presentation?.values).toEqual([{ key: 'Link header', value: 'Absent', kind: 'text' }])
  })

  it('reports a Link header without rel=canonical as not found and names the relations it does declare', async () => {
    const r = await run({ link: '</style.css>; rel="preload"; as="style", <https://cdn.example.test>; rel=preconnect' })
    expect(r.type).toBe('info')
    expect(r.presentation?.values).toEqual([
      { key: 'HTTP canonical', value: 'Not found', kind: 'text' },
      { key: 'Link relations', value: 'preload, preconnect', kind: 'text' },
    ])
  })

  it('every branch explains the HTTP input, never an HTML absence', async () => {
    const notCaptured = await run(undefined)
    const captured = await run({ link: '<https://example.test/a>; rel="canonical"' })
    expect(notCaptured.presentation?.noMarkup).toBe('None - this rule checks the HTTP Link response header, not document markup')
    expect(captured.presentation?.noMarkup).toBe('None - this rule checks the HTTP Link response header, not document markup')
  })

  it('exposes one parsed canonical URL as the observed value', async () => {
    const header = '<https://example.test/a>; rel="canonical"'
    const r = await run({ link: header })
    expect(r.type).toBe('ok')
    expect(r.priority).toBe(800)
    expect(r.presentation?.values).toEqual([{ key: 'HTTP canonical', value: 'https://example.test/a', kind: 'url' }])
    expect(r.presentation?.detailValues).toEqual([{ key: 'Link relations', value: 'canonical', kind: 'text' }])
  })

  it('errors for multiple distinct canonical values and shows each URL in the overview', async () => {
    const header = '<https://example.test/a>; rel="canonical", <https://example.test/b>; rel="canonical"'
    const r = await run({ link: header })
    expect(r.type).toBe('error')
    expect(r.priority).toBe(120)
    expect(r.presentation?.values).toEqual([
      { key: 'HTTP canonicals', value: 2, kind: 'text' },
      { key: 'HTTP canonical 1', value: 'https://example.test/a', kind: 'url' },
      { key: 'HTTP canonical 2', value: 'https://example.test/b', kind: 'url' },
    ])
  })

  it('keeps an unparseable header target as plain text, never a broken link', async () => {
    const r = await run({ link: '<not a real url>; rel="canonical"' })
    expect(r.presentation?.values).toEqual([{ key: 'HTTP canonical', value: 'not a real url', kind: 'text' }])
  })

  it('preserves references and removes the legacy details payload', async () => {
    const r = await run({ link: '<https://example.test/a>; rel="canonical"' })
    expect(r.presentation?.references).toEqual(rule.meta.references)
    expect(r.details).toBeUndefined()
  })
})
