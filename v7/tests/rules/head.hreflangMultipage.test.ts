import { describe, it, expect, vi, afterEach } from 'vitest'
import { hreflangMultipageRule } from '@/rules/head/hreflangMultipage'

const doc = (h: string) => new DOMParser().parseFromString(h, 'text/html')

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('rule: hreflang multipage', () => {
  it('returns info when no links', async () => {
    const r = await hreflangMultipageRule.run({ html:'', url:'https://example.com', doc: doc('<head></head>') } as any, { globals: {} })
    expect((r as any).type).toBe('info')
  })

  it('warns with the full hop chain when an alternate URL redirects', async () => {
    const pageHtml = `
      <link rel="canonical" href="https://example.com/page">
      <link rel="alternate" hreflang="en" href="https://example.com/page">
      <link rel="alternate" hreflang="de" href="https://example.com/de">
    `
    const body = `
      <link rel="alternate" hreflang="de" href="https://example.com/de">
      <link rel="alternate" hreflang="en" href="https://example.com/page">
    `
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url === 'https://example.com/de') {
        return { status: 301, type: 'basic', url, headers: new Headers({ location: 'https://example.com/de-final' }) } as any
      }
      return { status: 200, type: 'basic', url, headers: new Headers(), text: async () => body } as any
    }))
    const r = await hreflangMultipageRule.run({ html: pageHtml, url: 'https://example.com/page', doc: doc(pageHtml) } as any, { globals: {} })
    expect((r as any).type).toBe('warn')
    expect((r as any).message).toContain("'de' URL triggers redirect")
    expect((r as any).message).toContain('HTTP 301 -> Location: https://example.com/de-final')
    const checked = (r as any).details.checked as Array<{ hreflang: string; redirectChain?: { hops: Array<{ status: number }> } }>
    expect(checked[0]?.redirectChain?.hops.map((h) => h.status)).toEqual([301, 200])
  })

  it('passes when back-reference and self-reference exist', async () => {
    const pageHtml = `
      <link rel="canonical" href="https://example.com/page">
      <link rel="alternate" hreflang="en" href="https://example.com/page">
      <link rel="alternate" hreflang="de" href="https://example.com/de">
    `
    const fetchedBody = `
      <link rel="alternate" hreflang="de" href="https://example.com/de">
      <link rel="alternate" hreflang="en" href="https://example.com/page">
    `
    vi.stubGlobal('fetch', vi.fn(async () => ({
      redirected: false,
      status: 200,
      text: async () => fetchedBody,
    } as any)))
    const r = await hreflangMultipageRule.run({ html: pageHtml, url:'https://example.com/page', doc: doc(pageHtml) } as any, { globals: {} })
    expect((r as any).type).toBe('info')
  })
})
