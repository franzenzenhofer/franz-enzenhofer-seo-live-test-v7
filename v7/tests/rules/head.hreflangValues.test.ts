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

  it('returns ok when values are valid', async () => {
    const html = '<head><link rel="alternate" hreflang="en" href="/en" /><link rel="alternate" hreflang="de-AT" href="/de" /><link rel="alternate" hreflang="zh-Hant" href="/zh" /><link rel="alternate" hreflang="x-default" href="/" /></head>'
    const result = await run(html)
    expect(result.type).toBe('ok'); expect(result.priority).toBe(820)
    expect(value(result, 'Hreflang links')).toBe(4); expect(value(result, 'Invalid values')).toBe(0)
    expect(result.presentation?.markup).toEqual([])
    expect(result.details).toBeUndefined(); expect(toResultCopyPayload(result)).toContain(rule.meta.references[0])
  })

  it('warns on invalid values with complete markup and a labelled list', async () => {
    const html = '<head><link rel="alternate" hreflang="en_us" href="/en" /><link rel="alternate" hreflang="english" href="/en2" /></head>'
    const result = await run(html)
    expect(result.type).toBe('warn'); expect(result.priority).toBe(220)
    expect(value(result, 'Invalid values')).toBe(2)
    expect(detail(result, 'Invalid values (list)')).toBe('en_us, english')
    expect(result.presentation?.markup.map((field) => field.value)).toEqual([
      '<link rel="alternate" hreflang="en_us" href="/en">', '<link rel="alternate" hreflang="english" href="/en2">',
    ])
    expect(detail(result, 'Invalid examples retained')).toBe(2); expect(detail(result, 'Invalid examples omitted')).toBe(0)
  })

  it('warns on codes outside ISO 639-1 / ISO 3166-1 Alpha 2 (es-419, fil)', async () => {
    // Google: "other codes that aren't listed in those standards, such as es-419, aren't supported"
    const html = '<head><link rel="alternate" hreflang="es-419" href="/es" /><link rel="alternate" hreflang="fil" href="/fil" /></head>'
    const result = await run(html)
    expect(result.type).toBe('warn')
    expect(detail(result, 'Invalid values (list)')).toBe('es-419, fil')
  })

  it('bounds invalid evidence at ten and reports omitted invalid examples', async () => {
    const html = `<head>${Array.from({ length: 11 }, (_, i) => `<link rel="alternate" hreflang="bad${i}!" href="/${i}">`).join('')}</head>`
    const result = await run(html)
    expect(value(result, 'Invalid values')).toBe(11)
    expect(detail(result, 'Invalid examples retained')).toBe(10); expect(detail(result, 'Invalid examples omitted')).toBe(1)
    expect(result.presentation?.markup).toHaveLength(10)
  })
})
