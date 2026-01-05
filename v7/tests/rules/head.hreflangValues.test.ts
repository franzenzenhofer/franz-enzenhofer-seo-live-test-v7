import { describe, expect, it } from 'vitest'

import { hreflangValuesRule } from '@/rules/head/hreflangValues'

const D = (h: string) => new DOMParser().parseFromString(h, 'text/html')

describe('head: hreflang values', () => {
  it('returns ok when values are valid', async () => {
    const html = '<head><link rel="alternate" hreflang="en" href="/en" /><link rel="alternate" hreflang="x-default" href="/" /></head>'
    const r = await hreflangValuesRule.run({ html: '', url: 'https://ex.com', doc: D(html) } as any, { globals: {} })
    expect(r.type).toBe('ok')
  })

  it('warns on invalid values', async () => {
    const html = '<head><link rel="alternate" hreflang="en_us" href="/en" /><link rel="alternate" hreflang="english" href="/en" /></head>'
    const r = await hreflangValuesRule.run({ html: '', url: 'https://ex.com', doc: D(html) } as any, { globals: {} })
    expect(r.type).toBe('warn')
    expect(r.details.invalidValues.length).toBe(2)
  })
})
