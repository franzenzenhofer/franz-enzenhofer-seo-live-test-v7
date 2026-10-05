import { describe, expect, it } from 'vitest'

import { enrichResult } from '@/core/runHelpers'
import { hreflangRule as rule } from '@/rules/head/hreflang'
import { boundResult } from '@/shared/boundResult'
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

  it('inventories links: count, languages, then every <link hreflang> element in the overview and one record per link', async () => {
    const html = '<head><link rel="alternate" hreflang="en" href="/en"><link rel="alternate" hreflang="de-AT" href="https://example.com/de"></head>'
    const result = await run(html)
    expect(result.type).toBe('info'); expect(result.priority).toBe(710)
    expect(result.presentation?.values).toEqual([
      { key: 'Hreflang links', value: 2, kind: 'text' },
      { key: 'Languages', value: 'en, de-AT', kind: 'text' },
      { key: 'x-default', value: 'Not declared', kind: 'text' },
      { key: '<link hreflang="en">', value: '<link rel="alternate" hreflang="en" href="/en">', kind: 'original', fidelity: 'complete-original' },
      { key: '<link hreflang="de-at">', value: '<link rel="alternate" hreflang="de-AT" href="https://example.com/de">', kind: 'original', fidelity: 'complete-original' },
    ])
    expect(result.presentation?.evidence).toEqual([
      { name: '<link hreflang="en">', fields: [{ key: 'hreflang', value: 'en', kind: 'text' }, { key: 'href', value: '/en', kind: 'url' }, { key: 'DOM path', value: expect.any(String), kind: 'path' }] },
      { name: '<link hreflang="de-at">', fields: [{ key: 'hreflang', value: 'de-AT', kind: 'text' }, { key: 'href', value: 'https://example.com/de', kind: 'url' }, { key: 'DOM path', value: expect.any(String), kind: 'path' }] },
    ])
    expect(result.presentation?.detailValues).toEqual([
      { key: 'Markup retained', value: 2, kind: 'text' }, { key: 'Markup omitted', value: 0, kind: 'text' },
      { key: 'Evidence retained', value: 2, kind: 'text' }, { key: 'Evidence omitted', value: 0, kind: 'text' },
    ])
    expect(result.details).toBeUndefined(); expect(toResultCopyPayload(result)).toContain(rule.meta.references[0])
  })

  it('omits the x-default row when it is declared and names duplicate declarations', async () => {
    const html = '<head><link rel="alternate" hreflang="x-default" href="/"><link rel="alternate" hreflang="en" href="/1"><link rel="alternate" hreflang="en" href="/2"></head>'
    const result = await run(html)
    expect(value(result, 'Hreflang links')).toBe(3)
    expect(value(result, 'Languages')).toBe('x-default, en')
    expect(value(result, 'x-default')).toBeUndefined()
    expect(value(result, 'Duplicate values')).toBe('en (2 links)')
  })

  it('ships every link past the ten-element sample and summarizes the languages within 60 characters', async () => {
    const links = Array.from({ length: 15 }, (_, i) => `<link rel="alternate" hreflang="l${i}" href="https://ex.com/${i}">`).join('')
    const result = await run(`<head>${links}</head>`)
    expect(value(result, 'Hreflang links')).toBe(15)
    expect(value(result, 'Languages')).toBe('l0, l1, l2, l3, l4, l5, l6, l7, l8, l9, l10, l11 … 3 more')
    expect(String(value(result, 'Languages')).length).toBeLessThanOrEqual(60)
    expect(result.presentation?.values.some((field) => field.kind === 'original')).toBe(false)
    expect(result.presentation?.markup).toHaveLength(15)
    expect(result.presentation?.evidence).toHaveLength(15)
    expect(detail(result, 'Markup retained')).toBe(15); expect(detail(result, 'Markup omitted')).toBe(0)
    expect(detail(result, 'Evidence retained')).toBe(15); expect(detail(result, 'Evidence omitted')).toBe(0)
  })

  it('keeps whole records within the storage bound and states the truthful counts for 137 links', async () => {
    const links = Array.from({ length: 137 }, (_, i) => `<link rel="alternate" hreflang="xx-${String(i).padStart(2, '0')}" href="https://www.example.com/${'section/'.repeat(8)}${i}/">`).join('')
    const bounded = boundResult(await run(`<head>${links}</head>`)).presentation!
    expect(value({ presentation: bounded } as never, 'Hreflang links')).toBe(137)
    expect(bounded.evidence.length).toBeGreaterThan(0)
    expect(bounded.markup.length).toBeGreaterThan(0)
    const count = (key: string) => bounded.detailValues.find((field) => field.key === key)?.value
    expect(count('Markup retained')).toBe(bounded.markup.length)
    expect(count('Evidence retained')).toBe(bounded.evidence.length)
    expect(Number(count('Markup retained')) + Number(count('Markup omitted'))).toBe(137)
    expect(Number(count('Evidence retained')) + Number(count('Evidence omitted'))).toBe(137)
  })

  it('reports an undeclared href with a plain text field instead of a url field', async () => {
    const result = await run('<head><link rel="alternate" hreflang="en" href=""></head>')
    expect(result.presentation?.evidence[0]).toEqual({ name: '<link hreflang="en">', fields: [
      { key: 'hreflang', value: 'en', kind: 'text' }, { key: 'href', value: 'Not declared', kind: 'text' }, { key: 'DOM path', value: expect.any(String), kind: 'path' },
    ] })
  })
})
