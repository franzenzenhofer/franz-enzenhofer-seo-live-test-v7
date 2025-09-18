import { describe, it, expect, vi } from 'vitest'
import { canonicalRedirectsRule } from '@/rules/head/canonicalRedirects'

const doc = (h: string) => new DOMParser().parseFromString(h, 'text/html')

describe('rule: canonical redirects', () => {
  it('warns on 3xx', async () => {
    const orig = globalThis.fetch
    // @ts-expect-error test mock
    globalThis.fetch = vi.fn().mockResolvedValue({ status: 301, headers: new Map([['location','https://ex.com/']]) })
    const r = await canonicalRedirectsRule.run({ html:'', url:'', doc: doc('<link rel="canonical" href="https://ex.com"/>') }, { globals: {} })
    expect((r as any).type).toBe('warn')
    globalThis.fetch = orig
  })
})

