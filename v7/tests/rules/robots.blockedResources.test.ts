import { describe, it, expect, vi } from 'vitest'
import { robotsBlockedResourcesRule } from '@/rules/robots/blockedResources'

describe('rule: robots blocked resources', () => {
  it('warns when a resource is disallowed', async () => {
    const orig = globalThis.fetch
    // @ts-expect-error mock
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, text: async () => 'User-agent: *\nDisallow: /blocked' })
    const page = { html:'', url:'https://ex.com/page', doc: new DOMParser().parseFromString('<p/>','text/html'), resources: ['https://ex.com/blocked/a.js', 'https://ex.com/open/b.js'] }
    const r = await robotsBlockedResourcesRule.run(page as any, { globals: {} })
    expect((r as any).type).toBe('warn')
    globalThis.fetch = orig
  })
})

