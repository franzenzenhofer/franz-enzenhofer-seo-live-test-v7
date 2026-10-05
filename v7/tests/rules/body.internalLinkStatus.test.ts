import { afterEach, describe, expect, it, vi } from 'vitest'

import { enrichResult } from '@/core/runHelpers'
import { internalLinkStatusRule as rule } from '@/rules/body/internalLinkStatus'
import { toResultCopyPayload } from '@/components/result/resultCopy'

const D = (h: string) => new DOMParser().parseFromString(h, 'text/html')
const run = async (html: string, url = 'https://example.com') => enrichResult(await rule.run({ html, url, doc: D(html) } as any, { globals: {} }), rule, 'test')
const value = (result: Awaited<ReturnType<typeof run>>, key: string) => result.presentation?.values.find((field) => field.key === key)?.value
const detail = (result: Awaited<ReturnType<typeof run>>, key: string) => result.presentation?.detailValues.find((field) => field.key === key)?.value

describe('rule: internal link status', () => {
  afterEach(() => vi.restoreAllMocks())

  it('reports an invalid page URL without probing any link', async () => {
    const r = await run('<a href="/a">a</a>', 'invalid URL')
    expect(r.type).toBe('runtime_error'); expect(r.priority).toBe(10)
    expect(value(r, 'Current page URL')).toBe('Invalid URL')
    expect(r.presentation?.evidence).toEqual([])
  })

  it('returns ok with status summary when all links resolve 200', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 200 }))
    const r = await run('<a href="/a">a</a><a href="https://example.com/b">b</a>')
    expect(r.type).toBe('ok'); expect(r.priority).toBe(850)
    expect(r.presentation?.input).toBe('Static DOM + Page URL + internal link HTTP responses')
    expect(value(r, 'Statuses')).toBe('2× 200')
    expect(detail(r, 'Evidence retained')).toBe(2); expect(detail(r, 'Markup omitted')).toBe(2)
  })

  it('reports a page without internal links as information', async () => {
    const r = await run('<a href="https://other.test/x">x</a>')
    expect(r.type).toBe('info'); expect(r.priority).toBe(900)
    expect(value(r, 'Internal links found')).toBe(0)
    expect(r.presentation?.input).toBe('Static DOM + Page URL')
  })

  it('warns on an unverifiable link and keeps the hops captured before the failed hop', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url === 'https://example.com/moved') return { status: 301, type: 'basic', url, headers: new Headers({ location: 'https://example.com/down' }) }
      throw new TypeError('Failed to fetch')
    }))
    const r = await run('<a href="/moved">x</a>')
    expect(r.type).toBe('warn'); expect(r.priority).toBe(850)
    const fields = r.presentation?.evidence[0]?.fields
    expect(fields?.find((field) => field.key === 'Status')?.value).toBe('Request failed')
    expect(fields?.find((field) => field.key === 'Error')?.value).toBe('Failed to fetch')
    expect(fields?.find((field) => field.key === 'Hops before failure')?.value).toBe(1)
    expect(fields?.find((field) => field.key === 'Hop 1')?.value).toBe('HTTP 301 Moved Permanently')
    expect(fields?.find((field) => field.key === 'Hop 1 location')).toEqual({ key: 'Hop 1 location', value: 'https://example.com/down', kind: 'url' })
    expect(value(r, 'Statuses')).toBe('1× failed')
  })

  it('returns error when link returns 404', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 404 }))
    const r = await run('<a href="/missing">x</a>')
    expect(r.type).toBe('error'); expect(r.priority).toBe(150)
    expect(r.presentation?.evidence[0]?.fields.find((field) => field.key === 'Status')?.value).toBe('HTTP 404 Not Found')
  })

  it('captures the full redirect chain of a redirecting link', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url === 'https://example.com/moved') {
        return { status: 301, type: 'basic', url, headers: new Headers({ location: 'https://example.com/target' }) }
      }
      return { status: 200, type: 'basic', url, headers: new Headers() }
    }))
    const r = await run('<a href="/moved">x</a>')
    expect(r.type).toBe('ok')
    expect(detail(r, 'Redirecting links')).toBe(1)
    const link = r.presentation?.evidence[0]
    expect(link?.fields.find((field) => field.key === 'Redirect chain')?.value).toBe('1 redirect')
    expect(link?.fields.find((field) => field.key === 'Hop 1')?.value).toBe('HTTP 301 Moved Permanently')
    expect(link?.fields.find((field) => field.key === 'Hop 1 location')).toEqual({ key: 'Hop 1 location', value: 'https://example.com/target', kind: 'url' })
    expect(link?.fields.find((field) => field.key === 'Final URL')).toEqual({ key: 'Final URL', value: 'https://example.com/target', kind: 'url' })
    expect(link?.fields.filter((field) => field.kind === 'text').every((field) => !/https?:\/\//.test(String(field.value)))).toBe(true)
    expect(r.details).toBeUndefined(); expect(toResultCopyPayload(r)).toContain(rule.meta.references[0])
  })

  it('treats a redirect loop as a failed link', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      const target = url.endsWith('/l2') ? 'https://example.com/l1' : 'https://example.com/l2'
      return { status: 302, type: 'basic', url, headers: new Headers({ location: target }) }
    }))
    const r = await run('<a href="/l1">x</a>')
    expect(r.type).toBe('error')
    expect(r.presentation?.evidence[0]?.fields.find((field) => field.key === 'Redirect chain')?.value).toBe('Redirect loop')
  })

  it('samples random 5 from larger set', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 200 }))
    const links = Array.from({ length: 20 }, (_, i) => `<a href="/p${i}">p${i}</a>`).join('')
    const r = await run(links)
    expect(value(r, 'Links tested')).toBe(5)
    expect(detail(r, 'Unique internal link URLs')).toBe(20)
    expect(detail(r, 'Sampled from')).toContain('20 unique internal link URLs')
  })
})
