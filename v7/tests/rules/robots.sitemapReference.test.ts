import { describe, it, expect, vi } from 'vitest'
import { robotsSitemapReferenceRule } from '@/rules/robots/sitemapReference'

describe('rule: robots sitemap reference', () => {
  it('detects sitemap', async () => {
    const orig = globalThis.fetch
    // @ts-expect-error mock
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, text: async () => 'Sitemap: https://ex.com/sitemap.xml' })
    const r = await robotsSitemapReferenceRule.run({ html:'', url:'https://ex.com/a', doc: new DOMParser().parseFromString('<p/>','text/html') } as any, { globals: {} })
    expect((r as any).type).toBe('ok')
    globalThis.fetch = orig
  })
})

