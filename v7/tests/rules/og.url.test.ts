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
  it('normalizes both sides before comparing (bare origin vs trailing slash)', async () => {
    const html = '<link rel="canonical" href="https://example.com"><meta property="og:url" content="https://example.com">'
    const r = await ogUrlRule.run({ html, url:'https://example.com/', doc: doc(html) }, { globals: {} })
    expect((r as any).type).toBe('info')
  })
  it('still warns on a real canonical mismatch', async () => {
    const html = '<link rel="canonical" href="https://example.com/other"><meta property="og:url" content="https://example.com/page">'
    const r = await ogUrlRule.run({ html, url:'https://example.com/page', doc: doc(html) }, { globals: {} })
    expect((r as any).type).toBe('warn')
    expect((r as any).message).toContain('canonical')
  })
})
