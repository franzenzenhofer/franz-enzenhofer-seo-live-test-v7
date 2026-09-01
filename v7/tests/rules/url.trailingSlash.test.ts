import { afterEach, describe, it, expect, vi } from 'vitest'

import { scriptFetch } from '../helpers/redirectFetch'

import { trailingSlashRule } from '@/rules/url/trailingSlash'

import type { RedirectChain } from '@/shared/redirectChainTypes'

const D = (h: string) => new DOMParser().parseFromString(h, 'text/html')

describe('rule: trailing slash', () => {
  afterEach(() => vi.restoreAllMocks())

  it('reports ok when variant canonical points back to original', async () => {
    vi.stubGlobal('fetch', scriptFetch({
      'https://ex.com/a/': { status: 200, body: '<link rel="canonical" href="https://ex.com/a">' },
    }))
    const p = { html: '', url: 'https://ex.com/a', doc: D('<html></html>') }
    const r = await trailingSlashRule.run(p as any, { globals: {} })
    expect(r.type).toBe('info')
  })

  it('reports ok with the full chain when the variant redirects back to the original', async () => {
    vi.stubGlobal('fetch', scriptFetch({
      'https://ex.com/a/': { status: 301, location: 'https://ex.com/a' },
      'https://ex.com/a': { status: 200 },
    }))
    const p = { html: '', url: 'https://ex.com/a', doc: D('<html></html>') }
    const r = await trailingSlashRule.run(p as any, { globals: {} })
    expect(r.type).toBe('info')
    expect(r.message).toContain('HTTP 301 -> Location: https://ex.com/a')
    const chain = r.details?.['redirectChain'] as RedirectChain
    expect(chain.hops.map((h) => h.status)).toEqual([301, 200])
  })

  it('errors when variant redirects elsewhere, showing every hop', async () => {
    vi.stubGlobal('fetch', scriptFetch({
      'https://ex.com/a/': { status: 302, location: 'https://other.com/' },
      'https://other.com/': { status: 200 },
    }))
    const p = { html: '', url: 'https://ex.com/a', doc: D('<html></html>') }
    const r = await trailingSlashRule.run(p as any, { globals: {} })
    expect(r.type).toBe('error')
    expect(r.message).toContain('https://other.com/')
    expect(r.message).toContain('HTTP 302 -> Location: https://other.com/')
    expect(r.details?.['redirectChainText']).toContain('FINAL URL https://other.com/')
  })

  it('errors on a redirect loop of the variant', async () => {
    vi.stubGlobal('fetch', scriptFetch({
      'https://ex.com/a/': { status: 301, location: 'https://ex.com/b' },
      'https://ex.com/b': { status: 301, location: 'https://ex.com/a/' },
    }))
    const p = { html: '', url: 'https://ex.com/a', doc: D('<html></html>') }
    const r = await trailingSlashRule.run(p as any, { globals: {} })
    expect(r.type).toBe('error')
    expect(r.message).toContain('redirect loop')
    expect((r.details?.['redirectChain'] as RedirectChain).loop).toBe(true)
  })
})
