import { describe, it, expect } from 'vitest'
import { ogUrlRule } from '@/rules/og/url'

const doc = (h: string) => new DOMParser().parseFromString(h, 'text/html')

describe('rule: og url', () => {
  it('warns missing', async () => {
    const r = await ogUrlRule.run({ html:'', url:'https://example.com/page', doc: doc('<p/>') }, { globals: {} })
    expect((r as any).type).toBe('warn')
  })
  it('info present', async () => {
    const html = '<link rel="canonical" href="https://example.com/page"><meta property="og:url" content="https://example.com/page">'
    const r = await ogUrlRule.run({ html, url:'https://example.com/page', doc: doc(html) }, { globals: {} })
    expect((r as any).type).toBe('info')
  })
})
