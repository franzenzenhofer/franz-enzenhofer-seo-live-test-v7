import { afterEach, describe, expect, it, vi } from 'vitest'

import { robotsTxtRule } from '@/rules/robots/robotsTxt'

const D = () => new DOMParser().parseFromString('<p/>', 'text/html')
const page = (url: string) => ({ html: '', url, doc: D() })
const stub = (status: number, text = '') =>
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: status >= 200 && status < 300, status, text: async () => text }))

describe('rule: robots.txt exists', () => {
  afterEach(() => vi.restoreAllMocks())

  it('reports info when robots.txt exists (2xx)', async () => {
    stub(200, 'User-agent: *\nDisallow:')
    const r = await robotsTxtRule.run(page('https://exists.test/a') as never, { globals: {} })
    expect(r.type).toBe('info')
    expect(r.message).toContain('robots.txt exists')
    expect(r.details?.['robotsExists']).toBe(true)
  })

  it('treats 404 as valid allow-all state (info, not warn)', async () => {
    stub(404)
    const r = await robotsTxtRule.run(page('https://missing.test/a') as never, { globals: {} })
    expect(r.type).toBe('info')
    expect(r.message).toContain('all crawling allowed')
    expect(r.details?.['robotsExists']).toBe(false)
  })

  it('warns on 5xx (Google may assume complete disallow)', async () => {
    stub(500)
    const r = await robotsTxtRule.run(page('https://servererror.test/a') as never, { globals: {} })
    expect(r.type).toBe('warn')
    expect(r.message).toContain('unreachable')
    expect(r.details?.['status']).toBe(500)
  })

  it('warns on 429 like a server error, not like 404', async () => {
    stub(429)
    const r = await robotsTxtRule.run(page('https://ratelimited.test/a') as never, { globals: {} })
    expect(r.type).toBe('warn')
    expect(r.message).toContain('unreachable')
  })

  it('warns on network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('boom')))
    const r = await robotsTxtRule.run(page('https://netfail.test/a') as never, { globals: {} })
    expect(r.type).toBe('warn')
  })
})
