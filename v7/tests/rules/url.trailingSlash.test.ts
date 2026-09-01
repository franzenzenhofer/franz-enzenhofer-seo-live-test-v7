import { afterEach, describe, it, expect, vi } from 'vitest'

import { scriptFetch } from '../helpers/redirectFetch'

import { trailingSlashRule } from '@/rules/url/trailingSlash'

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

  it('reports ok with the full chain in details when the variant redirects back to the original', async () => {
    vi.stubGlobal('fetch', scriptFetch({
      'https://ex.com/a/': { status: 301, location: 'https://ex.com/a' },
      'https://ex.com/a': { status: 200 },
    }))
    const p = { html: '', url: 'https://ex.com/a', doc: D('<html></html>') }
    const r = await trailingSlashRule.run(p as any, { globals: {} })
    expect(r.type).toBe('info')
    // The message stays a short verdict; the full hop chain lives in details.
    expect(r.message).toBe('URL variant with trailing slash redirects to without version (OK).')
    const chainText = r.details?.['redirectChainText'] as string
    expect(chainText).toContain('HTTP 301 -> Location: https://ex.com/a')
    expect(chainText).toContain('FINAL STATUS HTTP 200')
    expect(r.details?.['redirectChain']).toBeUndefined()
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
    expect(r.message).not.toContain('HTTP 302 -> Location:')
    expect(r.details?.['redirectChainText']).toContain('HTTP 302 -> Location: https://other.com/')
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
    expect(r.details?.['redirectChainText']).toContain('REDIRECT LOOP')
  })
})
