import { afterEach, describe, expect, it, vi } from 'vitest'

import { internalLinkStatusRule } from '@/rules/body/internalLinkStatus'

const D = (h: string) => new DOMParser().parseFromString(h, 'text/html')

describe('rule: internal link status', () => {
  afterEach(() => vi.restoreAllMocks())

  it('returns ok when internal links resolve', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 200 }))
    const doc = D('<a href="/a">a</a><a href="https://example.com/b">b</a>')
    const p = { html: '', url: 'https://example.com', doc }
    const r = await internalLinkStatusRule.run(p as any, { globals: {} })
    expect(r.type).toBe('ok')
  })
})
