import { afterEach, describe, expect, it, vi } from 'vitest'

import { robotsTxtSizeRule } from '@/rules/robots/robotsTxtSize'

const D = (h: string) => new DOMParser().parseFromString(h, 'text/html')

describe('rule: robots txt size', () => {
  afterEach(() => vi.restoreAllMocks())

  it('warns when robots.txt exceeds 500 KiB', async () => {
    const large = 'a'.repeat(512001)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: async () => large }))
    const r = await robotsTxtSizeRule.run({ html: '', url: 'https://large.example', doc: D('') } as any, { globals: {} })
    expect(r.type).toBe('warn')
    expect(r.details.bytes).toBeGreaterThan(512000)
  })

  it('reports info when robots.txt is within limit', async () => {
    const small = 'a'.repeat(1024)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: async () => small }))
    const r = await robotsTxtSizeRule.run({ html: '', url: 'https://small.example', doc: D('') } as any, { globals: {} })
    expect(r.type).toBe('info')
  })
})
