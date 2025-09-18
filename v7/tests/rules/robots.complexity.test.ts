import { describe, it, expect, vi } from 'vitest'
import { robotsComplexityRule } from '@/rules/robots/complexity'

describe('rule: robots complexity', () => {
  it('counts rules', async () => {
    const orig = globalThis.fetch
    // @ts-expect-error mock
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, text: async () => 'User-agent: *\nDisallow: /a\nAllow: /b\nSitemap: https://ex.com/sitemap.xml' })
    const r = await robotsComplexityRule.run({ html:'', url:'https://ex.com', doc: new DOMParser().parseFromString('<p/>','text/html') } as any, { globals: {} })
    expect((r as any).message.includes('Disallow')).toBe(true)
    globalThis.fetch = orig
  })
})

