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

  it('captures the full redirect chain of a redirecting link', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url === 'https://example.com/moved') {
        return { status: 301, type: 'basic', url, headers: new Headers({ location: 'https://example.com/target' }) }
      }
      return { status: 200, type: 'basic', url, headers: new Headers() }
    }))
    const doc = D('<a href="/moved">x</a>')
    const r = await internalLinkStatusRule.run({ html: '', url: 'https://example.com', doc } as any, { globals: {} })
    expect(r.type).toBe('ok')
    expect(r.message).toContain('1 sampled link redirect')
    // The message stays a short verdict; the full hop chain lives in details.
    expect(r.message).not.toContain('HTTP 301 -> Location:')
    expect(r.details?.redirectChainText).toContain('HTTP 301 -> Location: https://example.com/target')
    expect(r.details?.redirectChainText).toContain('FINAL STATUS HTTP 200')
    const checked = r.details?.checked as Array<{ redirectChain?: unknown }>
    expect(checked[0]?.redirectChain).toBeUndefined()
  })

  it('treats a redirect loop as a failed link', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      const target = url.endsWith('/l2') ? 'https://example.com/l1' : 'https://example.com/l2'
      return { status: 302, type: 'basic', url, headers: new Headers({ location: target }) }
    }))
    const doc = D('<a href="/l1">x</a>')
    const r = await internalLinkStatusRule.run({ html: '', url: 'https://example.com', doc } as any, { globals: {} })
    expect(r.type).toBe('error')
    expect(r.details?.redirectChainText).toContain('REDIRECT LOOP')
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
