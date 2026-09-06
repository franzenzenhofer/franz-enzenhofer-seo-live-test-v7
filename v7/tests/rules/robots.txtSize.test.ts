import { afterEach, describe, expect, it, vi } from 'vitest'

import { robotsTxtSizeRule } from '@/rules/robots/robotsTxtSize'

const D = (h: string) => new DOMParser().parseFromString(h, 'text/html')

describe('rule: robots txt size', () => {
  afterEach(() => vi.restoreAllMocks())

  it('warns when robots.txt reaches the 500 KiB limit Google reads', async () => {
    const large = 'a'.repeat(512001)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => large }))
    const r = await robotsTxtSizeRule.run({ html: '', url: 'https://large.example', doc: D('') } as any, { globals: {} })
    expect(r.type).toBe('warn')
    // Only the first 500 KiB is read, so the rule reports the limit it hit -
    // never an exact size it never measured.
    expect(r.details.bytesRead).toBe(512000)
    expect(r.details.truncatedAtLimit).toBe(true)
    expect(r.message).toContain('larger than')
  })

  it('reports info when robots.txt is within limit', async () => {
    const small = 'a'.repeat(1024)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => small }))
    const r = await robotsTxtSizeRule.run({ html: '', url: 'https://small.example', doc: D('') } as any, { globals: {} })
    expect(r.type).toBe('info')
    expect(r.details.truncatedAtLimit).toBe(false)
  })
})
