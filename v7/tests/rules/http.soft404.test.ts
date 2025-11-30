import { afterEach, describe, it, expect, vi } from 'vitest'

import { soft404Rule } from '@/rules/http/soft404'

const page = { html: '', url: 'https://ex.com/path/page', doc: new DOMParser().parseFromString('<p/>', 'text/html') }

describe('rule: soft 404 probe', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns ok when non-existing URL returns 404 directly', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 404, redirected: false, url: 'https://ex.com/fake' }))
    const r = await soft404Rule.run(page as any, { globals: {} })
    expect(r.type).toBe('ok')
  })

  it('flags soft 404 when 200', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 200, redirected: false, url: 'https://ex.com/fake' }))
    const r = await soft404Rule.run(page as any, { globals: {} })
    expect(r.type).toBe('error')
  })

  it('flags redirected 404', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 404, redirected: true, url: 'https://ex.com/redirected' }))
    const r = await soft404Rule.run(page as any, { globals: {} })
    expect(r.type).toBe('error')
  })
})
