import { afterEach, describe, expect, it, vi } from 'vitest'

import { internalLinkStatusRule } from '@/rules/body/internalLinkStatus'
import { soft404Rule } from '@/rules/http/soft404'
import { trailingSlashRule } from '@/rules/url/trailingSlash'
import { hreflangMultipageRule } from '@/rules/head/hreflangMultipage'
import { discardBody } from '@/shared/http-utils'

const D = (h: string) => new DOMParser().parseFromString(h, 'text/html')

const mockRes = (over: Record<string, unknown> = {}) => {
  const cancel = vi.fn().mockResolvedValue(undefined)
  const res = { status: 200, redirected: false, url: '', body: { cancel }, ...over }
  return { res, cancel }
}

describe('probe rules cancel response bodies they never read', () => {
  afterEach(() => vi.restoreAllMocks())

  it('internal link status cancels each sampled body', async () => {
    const { res, cancel } = mockRes({ status: 200 })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(res))
    const page = { html: '', url: 'https://ex.test/', doc: D('<a href="/a">a</a>') }
    const r = await internalLinkStatusRule.run(page as never, { globals: {} })
    expect(r.type).toBe('ok')
    expect(cancel).toHaveBeenCalledTimes(1)
  })

  it('soft 404 probe cancels the probe body', async () => {
    const { res, cancel } = mockRes({ status: 404, url: 'https://ex.test/x' })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(res))
    const page = { html: '', url: 'https://ex.test/page', doc: D('<p/>'), headers: { 'content-type': 'text/html' } }
    const r = await soft404Rule.run(page as never, { globals: {} })
    expect(r.type).toBe('ok')
    expect(cancel).toHaveBeenCalledTimes(1)
  })

  it('trailing slash cancels the body when the variant redirects', async () => {
    const { res, cancel } = mockRes({ status: 200, redirected: true, url: 'https://ex.test/a/' })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(res))
    const page = { html: '', url: 'https://ex.test/a/', doc: D('<p/>') }
    const r = await trailingSlashRule.run(page as never, { globals: {} })
    expect(r.type).toBe('info')
    expect(cancel).toHaveBeenCalledTimes(1)
  })

  it('hreflang multipage cancels the body of non-200 alternates', async () => {
    const { res, cancel } = mockRes({ status: 404 })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(res))
    const html = '<head><link rel="canonical" href="https://ex.test/en">'
      + '<link rel="alternate" hreflang="en" href="https://ex.test/en">'
      + '<link rel="alternate" hreflang="de" href="https://ex.test/de"></head>'
    const page = { html: '', url: 'https://ex.test/en', doc: D(html) }
    const r = await hreflangMultipageRule.run(page as never, { globals: {} })
    expect(r.message).toContain('HTTP 404')
    expect(cancel).toHaveBeenCalledTimes(1)
  })

  it('discardBody tolerates missing bodies and rejecting cancels', async () => {
    expect(() => discardBody({} as Response)).not.toThrow()
    const rejecting = { body: { cancel: vi.fn().mockRejectedValue(new Error('locked')) } }
    expect(() => discardBody(rejecting as unknown as Response)).not.toThrow()
    await new Promise((r) => setTimeout(r, 0))
  })
})
