import { describe, expect, it } from 'vitest'

import { enrichResult } from '@/core/runHelpers'
import { hreflangRule as rule } from '@/rules/head/hreflang'
import { toResultCopyPayload } from '@/components/result/resultCopy'

const doc = (h: string) => new DOMParser().parseFromString(h, 'text/html')
const run = async (html: string) => enrichResult(await rule.run({ html, url: 'https://example.com/page', doc: doc(html) }, { globals: {} }), rule, 'test')
const value = (result: Awaited<ReturnType<typeof run>>, key: string) => result.presentation?.values.find((field) => field.key === key)?.value
const detail = (result: Awaited<ReturnType<typeof run>>, key: string) => result.presentation?.detailValues.find((field) => field.key === key)?.value

describe('hreflang links rule', () => {
  it('reports no links as informational with a zero count', async () => {
    const result = await run('<head></head>')
    expect(result.type).toBe('info'); expect(result.priority).toBe(900)
    expect(value(result, 'Hreflang links')).toBe(0)
    expect(result.presentation?.markup).toEqual([])
    expect(result.label).toBe('HEAD')
  })

  it('inventories links with complete original markup and language list', async () => {
    const html = '<head><link rel="alternate" hreflang="en" href="/en"><link rel="alternate" hreflang="de-AT" href="https://example.com/de"></head>'
    const result = await run(html)
    expect(result.type).toBe('info'); expect(result.priority).toBe(710)
    expect(value(result, 'Hreflang links')).toBe(2); expect(value(result, 'Distinct languages')).toBe(2)
    expect(detail(result, 'Languages')).toBe('en, de-AT')
    expect(result.presentation?.markup.map((field) => field.value)).toEqual([
      '<link rel="alternate" hreflang="en" href="/en">', '<link rel="alternate" hreflang="de-AT" href="https://example.com/de">',
    ])
    expect(result.presentation?.evidence).toEqual([
      { name: 'Hreflang 1', fields: [{ key: 'Language', value: 'en', kind: 'text' }, { key: 'Href', value: '/en', kind: 'url' }] },
      { name: 'Hreflang 2', fields: [{ key: 'Language', value: 'de-AT', kind: 'text' }, { key: 'Href', value: 'https://example.com/de', kind: 'url' }] },
    ])
    expect(result.details).toBeUndefined(); expect(toResultCopyPayload(result)).toContain(rule.meta.references[0])
  })

  it('deduplicates repeated language declarations for the distinct language count', async () => {
    const html = '<head><link rel="alternate" hreflang="en" href="/1"><link rel="alternate" hreflang="en" href="/2"></head>'
    const result = await run(html)
    expect(value(result, 'Hreflang links')).toBe(2); expect(value(result, 'Distinct languages')).toBe(1)
    expect(detail(result, 'Languages')).toBe('en')
  })

  it('retains only a bounded sample of markup while keeping every language and pair', async () => {
    const links = Array.from({ length: 15 }, (_, i) => `<link rel="alternate" hreflang="l${i}" href="https://ex.com/${i}">`).join('')
    const result = await run(`<head>${links}</head>`)
    expect(value(result, 'Hreflang links')).toBe(15); expect(value(result, 'Distinct languages')).toBe(15)
    expect(result.presentation?.markup).toHaveLength(10)
    expect(detail(result, 'Markup elements retained')).toBe(10); expect(detail(result, 'Markup elements omitted')).toBe(5)
    expect(detail(result, 'Attribute pairs retained')).toBe(15); expect(detail(result, 'Attribute pairs omitted')).toBe(0)
    expect(result.presentation?.evidence).toHaveLength(15)
  })

  it('reports an undeclared href with a plain text field instead of a url field', async () => {
    const result = await run('<head><link rel="alternate" hreflang="en" href=""></head>')
    expect(result.presentation?.evidence[0]).toEqual({ name: 'Hreflang 1', fields: [
      { key: 'Language', value: 'en', kind: 'text' }, { key: 'Href', value: 'Not declared', kind: 'text' },
    ] })
  })
})
