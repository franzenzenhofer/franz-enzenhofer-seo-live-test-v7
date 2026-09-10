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
    expect(missing.type).toBe('warn'); expect(missing.priority).toBe(500); expect(value(missing, 'og:url')).toBe('Absent')
    const empty = await run('<meta property="og:url" data-source="cms" content="">')
    expect(empty.type).toBe('warn'); expect(empty.priority).toBe(400); expect(value(empty, 'og:url')).toBe('Empty')
    expect(empty.presentation?.markup[0].value).toBe('<meta property="og:url" data-source="cms" content="">')
  })

  it('warns for a non-absolute URL while retaining its observed value', async () => {
    const result = await run('<meta name="og:url" content="/page">')
    expect(result.type).toBe('warn'); expect(result.priority).toBe(350); expect(value(result, 'og:url')).toBe('Not absolute')
    expect(value(result, 'Declared URL (trimmed)')).toBe('/page')
  })

  it('passes a URL consistent with canonical and document location', async () => {
    const html = '<link rel="canonical" href="https://example.com"><meta property="og:url" content="https://example.com">'
    const result = await run(html, 'https://example.com/')
    expect(result.type).toBe('info'); expect(result.priority).toBe(760); expect(value(result, 'og:url')).toBe('Consistent')
    expect(detail(result, 'Resolved og:url')).toBe('https://example.com/')
    expect(result.details).toBeUndefined(); expect(toResultCopyPayload(result)).toContain(rule.meta.references[0])
  })

  it('warns on a canonical mismatch before comparing document location', async () => {
    const html = '<link rel="canonical" href="https://example.com/other"><meta property="og:url" content="https://example.com/page">'
    const result = await run(html)
    expect(result.type).toBe('warn'); expect(result.priority).toBe(300); expect(value(result, 'og:url')).toBe('Canonical mismatch')
    expect(detail(result, 'Canonical URL')).toBe('https://example.com/other')
    expect(result.presentation?.markup.some((field) => field.value === '<link rel="canonical" href="https://example.com/other">')).toBe(true)
    expect(result.label).toBe('HEAD')
  })

  it('warns on a document-location mismatch when canonical is absent', async () => {
    const result = await run('<meta property="og:url" content="https://example.com/other">')
    expect(result.type).toBe('warn'); expect(result.priority).toBe(300); expect(value(result, 'og:url')).toBe('Document location mismatch')
    expect(detail(result, 'Canonical URL')).toBe('Not declared or empty')
  })

  it('retains only a bounded sample of duplicate declarations', async () => {
    const html = Array.from({ length: 11 }, (_, index) => `<meta property="og:url" content="https://example.com/page-${index + 1}">`).join('')
    const result = await run(html, 'https://example.com/page-1')
    expect(detail(result, 'Elements omitted')).toBe(1)
    expect(result.presentation?.markup).toHaveLength(10)
  })
})
