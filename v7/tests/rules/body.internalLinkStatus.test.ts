import { afterEach, describe, expect, it, vi } from 'vitest'

import { internalLinkStatusRule } from '@/rules/body/internalLinkStatus'

const D = (h: string) => new DOMParser().parseFromString(h, 'text/html')

describe('rule: internal link status', () => {
  afterEach(() => vi.restoreAllMocks())

  it('returns ok with status summary when all links resolve 200', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 200 }))
    const doc = D('<a href="/a">a</a><a href="https://example.com/b">b</a>')
    const r = await internalLinkStatusRule.run({ html: '', url: 'https://example.com', doc } as any, { globals: {} })
    expect(r.type).toBe('ok')
    expect(r.message).toContain('200')
    expect(r.details.statusSummary).toContain('200')
  })

  it('returns error when link returns 404', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 404 }))
    const doc = D('<a href="/missing">x</a>')
    const r = await internalLinkStatusRule.run({ html: '', url: 'https://example.com', doc } as any, { globals: {} })
    expect(r.type).toBe('error')
    expect(r.message).toContain('404')
  })

  it('samples random 5 from larger set', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 200 }))
    const links = Array.from({ length: 20 }, (_, i) => `<a href="/p${i}">p${i}</a>`).join('')
    const doc = D(links)
    const r = await internalLinkStatusRule.run({ html: '', url: 'https://example.com', doc } as any, { globals: {} })
    expect(r.details.sampleSize).toBe(5)
    expect(r.details.totalInternal).toBe(20)
    expect(r.message).toContain('20 internal links')
  })
})
