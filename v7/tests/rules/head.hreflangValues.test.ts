import { describe, expect, it } from 'vitest'

import { enrichResult } from '@/core/runHelpers'
import { hreflangValuesRule as rule } from '@/rules/head/hreflangValues'
import { toResultCopyPayload } from '@/components/result/resultCopy'

const D = (h: string) => new DOMParser().parseFromString(h, 'text/html')
const run = async (html: string) => enrichResult(await rule.run({ html: '', url: 'https://ex.com', doc: D(html) }, { globals: {} }), rule, 'test')
const value = (result: Awaited<ReturnType<typeof run>>, key: string) => result.presentation?.values.find((field) => field.key === key)?.value
const detail = (result: Awaited<ReturnType<typeof run>>, key: string) => result.presentation?.detailValues.find((field) => field.key === key)?.value

describe('head: hreflang values', () => {
  it('reports no links as informational with a zero count', async () => {
    const result = await run('<head></head>')
    expect(result.type).toBe('info'); expect(result.priority).toBe(900)
    expect(value(result, 'Hreflang links')).toBe(0)
    expect(result.presentation?.markup).toEqual([])
  })

  it('returns ok when values are valid, listing the values and shipping every inspected link in details', async () => {
    const html = '<head><link rel="alternate" hreflang="en" href="/en" /><link rel="alternate" hreflang="de-AT" href="/de" /><link rel="alternate" hreflang="zh-Hant" href="/zh" /><link rel="alternate" hreflang="x-default" href="/" /></head>'
    const result = await run(html)
    expect(result.type).toBe('ok'); expect(result.priority).toBe(820)
    expect(result.presentation?.values).toEqual([
      { key: 'Hreflang links', value: 4, kind: 'text' },
      { key: 'Hreflang values', value: 'en, de-AT, zh-Hant, x-default', kind: 'text' },
    ])
    expect(result.presentation?.markup.map((field) => field.key)).toEqual(['<link hreflang="en">', '<link hreflang="de-at">', '<link hreflang="zh-hant">', '<link hreflang="x-default">'])
    expect(result.presentation?.evidence).toHaveLength(4)
    expect(detail(result, 'Markup retained')).toBe(4); expect(detail(result, 'Evidence omitted')).toBe(0)
    expect(result.details).toBeUndefined(); expect(toResultCopyPayload(result)).toContain(rule.meta.references[0])
  })

  it('warns on invalid values with the values listed and the offending elements in the overview', async () => {
    const html = '<head><link rel="alternate" hreflang="en_us" href="/en" /><link rel="alternate" hreflang="english" href="/en2" /></head>'
    const result = await run(html)
    expect(result.type).toBe('warn'); expect(result.priority).toBe(220)
    expect(result.presentation?.values).toEqual([
      { key: 'Hreflang links', value: 2, kind: 'text' },
      { key: 'Invalid values', value: 'en_us, english', kind: 'text' },
      { key: '<link hreflang="en_us">', value: '<link rel="alternate" hreflang="en_us" href="/en">', kind: 'original', fidelity: 'complete-original' },
      { key: '<link hreflang="english">', value: '<link rel="alternate" hreflang="english" href="/en2">', kind: 'original', fidelity: 'complete-original' },
    ])
    expect(result.presentation?.evidence[0]).toEqual({ name: '<link hreflang="en_us">', fields: [
      { key: 'hreflang', value: 'en_us', kind: 'text' }, { key: 'href', value: '/en', kind: 'url' }, { key: 'DOM path', value: expect.any(String), kind: 'path' },
    ] })
    expect(detail(result, 'Markup retained')).toBe(2); expect(detail(result, 'Markup omitted')).toBe(0)
  })

  it('warns on codes outside ISO 639-1 / ISO 3166-1 Alpha 2 (es-419, fil)', async () => {
    // Google: "other codes that aren't listed in those standards, such as es-419, aren't supported"
    const html = '<head><link rel="alternate" hreflang="es-419" href="/es" /><link rel="alternate" hreflang="fil" href="/fil" /></head>'
    const result = await run(html)
    expect(result.type).toBe('warn')
    expect(value(result, 'Invalid values')).toBe('es-419, fil')
  })

  it('bounds invalid evidence at ten and reports omitted invalid examples', async () => {
    const html = `<head>${Array.from({ length: 11 }, (_, i) => `<link rel="alternate" hreflang="bad${i}!" href="/${i}">`).join('')}</head>`
    const result = await run(html)
    expect(value(result, 'Invalid values')).toBe('bad0!, bad1!, bad2!, bad3!, bad4!, bad5!, bad6! … 4 more')
    expect(detail(result, 'Markup retained')).toBe(10); expect(detail(result, 'Markup omitted')).toBe(1)
    expect(result.presentation?.markup).toHaveLength(10)
    expect(result.presentation?.values.some((field) => field.kind === 'original')).toBe(false)
  })
})
