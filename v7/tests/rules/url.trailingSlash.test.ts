import { afterEach, describe, it, expect, vi } from 'vitest'

import { trailingSlashRule } from '@/rules/url/trailingSlash'

const D = (h: string) => new DOMParser().parseFromString(h, 'text/html')

describe('rule: trailing slash', () => {
  afterEach(() => vi.restoreAllMocks())

  it('reports ok when variant canonical points back to original', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      status: 200,
      redirected: false,
      url: 'https://ex.com/a/',
      text: async () => '<link rel="canonical" href="https://ex.com/a">',
    }))
    const p = { html: '', url: 'https://ex.com/a', doc: D('<html></html>') }
    const r = await trailingSlashRule.run(p as any, { globals: {} })
    expect(r.type).toBe('info')
  })

  it('errors when variant redirects elsewhere', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      status: 200,
      redirected: true,
      url: 'https://other.com/',
      text: async () => '',
    }))
    const p = { html: '', url: 'https://ex.com/a', doc: D('<html></html>') }
    const r = await trailingSlashRule.run(p as any, { globals: {} })
    expect(r.type).toBe('error')
  })
})
