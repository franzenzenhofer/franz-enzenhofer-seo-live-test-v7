import { describe, expect, it } from 'vitest'

import { hreflangValuesRule } from '@/rules/head/hreflangValues'

const D = (h: string) => new DOMParser().parseFromString(h, 'text/html')

describe('head: hreflang values', () => {
  it('returns ok when values are valid', async () => {
    const html = '<head><link rel="alternate" hreflang="en" href="/en" /><link rel="alternate" hreflang="de-AT" href="/de" /><link rel="alternate" hreflang="zh-Hant" href="/zh" /><link rel="alternate" hreflang="x-default" href="/" /></head>'
    const r = await hreflangValuesRule.run({ html: '', url: 'https://ex.com', doc: D(html) } as any, { globals: {} })
    expect(r.type).toBe('ok')
  })

  it('warns on invalid values', async () => {
    const html = '<head><link rel="alternate" hreflang="en_us" href="/en" /><link rel="alternate" hreflang="english" href="/en" /></head>'
    const r = await hreflangValuesRule.run({ html: '', url: 'https://ex.com', doc: D(html) } as any, { globals: {} })
    expect(r.type).toBe('warn')
    expect(r.details.invalidValues.length).toBe(2)
  })

  it('warns on codes outside ISO 639-1 / ISO 3166-1 Alpha 2 (es-419, fil)', async () => {
    // Google: "other codes that aren't listed in those standards, such as es-419, aren't supported"
    const html = '<head><link rel="alternate" hreflang="es-419" href="/es" /><link rel="alternate" hreflang="fil" href="/fil" /></head>'
    const r = await hreflangValuesRule.run({ html: '', url: 'https://ex.com', doc: D(html) } as any, { globals: {} })
    expect(r.type).toBe('warn')
    expect(r.details.invalidValues).toEqual(['es-419', 'fil'])
  })
})
