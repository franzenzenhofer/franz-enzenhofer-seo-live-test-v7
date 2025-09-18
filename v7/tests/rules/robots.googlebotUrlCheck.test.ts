import { describe, it, expect, vi } from 'vitest'
import { googlebotUrlCheckRule } from '@/rules/robots/googlebotUrlCheck'

describe('rule: googlebot url check', () => {
  it('reports allowed', async () => {
    const orig = globalThis.fetch
    // @ts-expect-error mock
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, text: async () => 'User-agent: *\nAllow: /' })
    const r = await googlebotUrlCheckRule.run({ html:'', url:'https://ex.com/a', doc: new DOMParser().parseFromString('<p/>','text/html') } as any, { globals: {} })
    expect((r as any).type).toBe('ok')
    globalThis.fetch = orig
  })
})

