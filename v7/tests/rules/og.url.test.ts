import { describe, expect, it } from 'vitest'

import { enrichResult } from '@/core/runHelpers'
import { ogUrlRule as rule } from '@/rules/og/url'
import { toResultCopyPayload } from '@/components/result/resultCopy'

const doc = (h: string) => new DOMParser().parseFromString(h, 'text/html')
const run = async (html: string, url = 'https://example.com/page') => enrichResult(await rule.run({ html, url, doc: doc(html) }, { globals: {} }), rule, 'test')
const value = (result: Awaited<ReturnType<typeof run>>, key: string) => result.presentation?.values.find((field) => field.key === key)?.value
const detail = (result: Awaited<ReturnType<typeof run>>, key: string) => result.presentation?.detailValues.find((field) => field.key === key)?.value

describe('Open Graph URL rule', () => {
  it('warns when the first URL declaration is missing or empty', async () => {
    const missing = await run('<p/>')
    expect(missing.type).toBe('warn'); expect(missing.priority).toBe(500); expect(value(missing, 'og:url')).toBe('Not found')
    const empty = await run('<meta property="og:url" data-source="cms" content="">')
    expect(empty.type).toBe('warn'); expect(empty.priority).toBe(400); expect(value(empty, 'og:url')).toBe('Empty')
    expect(empty.presentation?.markup[0].value).toBe('<meta property="og:url" data-source="cms" content="">')
  })

  it('warns for a non-absolute URL while retaining its observed value', async () => {
    const result = await run('<meta name="og:url" content="/page">')
    expect(result.type).toBe('warn'); expect(result.priority).toBe(350); expect(value(result, 'og:url')).toBe('/page')
    expect(value(result, 'URL form')).toBe('Relative')
  })

  it('passes a URL consistent with canonical and document location', async () => {
    const html = '<link rel="canonical" href="https://example.com"><meta property="og:url" content="https://example.com">'
    const result = await run(html, 'https://example.com/')
    expect(result.type).toBe('info'); expect(result.priority).toBe(760)
    expect(result.presentation?.values.map((field) => [field.key, field.value])).toEqual([
      ['og:url', 'https://example.com/'], ['Canonical URL', 'https://example.com/'], ['Comparison', 'Equals canonical URL'],
      ['<meta property="og:url">', '<meta property="og:url" content="https://example.com">'], ['<link rel="canonical">', '<link rel="canonical" href="https://example.com">'],
    ])
    expect(result.presentation?.evidence.map((record) => record.name)).toEqual(['<meta property="og:url">', '<link rel="canonical">'])
    expect(detail(result, 'Markup retained')).toBe(2); expect(detail(result, 'Evidence omitted')).toBe(0)
    expect(result.details).toBeUndefined(); expect(toResultCopyPayload(result)).toContain(rule.meta.references[0])
  })

  it('warns on a canonical mismatch before comparing document location', async () => {
    const html = '<link rel="canonical" href="https://example.com/other"><meta property="og:url" content="https://example.com/page">'
    const result = await run(html)
    expect(result.type).toBe('warn'); expect(result.priority).toBe(300); expect(value(result, 'og:url')).toBe('https://example.com/page')
    expect(value(result, 'Canonical URL')).toBe('https://example.com/other'); expect(value(result, 'Comparison')).toBe('Differs from canonical URL (path)')
    expect(result.presentation?.markup.some((field) => field.value === '<link rel="canonical" href="https://example.com/other">')).toBe(true)
    expect(result.label).toBe('HEAD')
  })

  it('warns on a document-location mismatch when canonical is absent', async () => {
    const result = await run('<meta property="og:url" content="https://example.com/other">')
    expect(result.type).toBe('warn'); expect(result.priority).toBe(300); expect(value(result, 'og:url')).toBe('https://example.com/other')
    expect(value(result, 'Current page URL')).toBe('https://example.com/page'); expect(value(result, 'Comparison')).toBe('Differs from current page URL (path)')
    expect(detail(result, 'Canonical link')).toBe('Not found')
  })

  it('names the page URL as the differing side when og:url equals the canonical but not the document URL', async () => {
    const html = '<link rel="canonical" href="https://example.com/page"><meta property="og:url" content="https://example.com/page">'
    const result = await run(html, 'https://example.com/page?hl=en')
    expect(result.type).toBe('warn'); expect(result.priority).toBe(300)
    expect(result.presentation?.values.filter((field) => field.kind !== 'original').map((field) => [field.key, field.value])).toEqual([
      ['og:url', 'https://example.com/page'], ['Canonical URL', 'https://example.com/page'], ['Current page URL', 'https://example.com/page?hl=en'], ['Comparison', 'Differs from current page URL (query)'],
    ])
  })

  it('retains only a bounded sample of duplicate declarations', async () => {
    const html = Array.from({ length: 11 }, (_, index) => `<meta property="og:url" content="https://example.com/page-${index + 1}">`).join('')
    const result = await run(html, 'https://example.com/page-1')
    expect(detail(result, 'Markup omitted')).toBe(1)
    expect(result.presentation?.markup).toHaveLength(10)
    expect(result.presentation?.values.some((field) => field.kind === 'original')).toBe(false)
  })
})
