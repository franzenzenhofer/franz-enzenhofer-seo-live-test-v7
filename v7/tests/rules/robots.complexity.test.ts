import { afterEach, describe, expect, it, vi } from 'vitest'

import { robotsComplexityRule as rule } from '@/rules/robots/complexity'
import { enrichResult } from '@/core/runHelpers'
import { toResultCopyPayload } from '@/components/result/resultCopy'

const run = async (url: string) => enrichResult(await rule.run({ html: '', url, doc: new DOMParser().parseFromString('<p/>', 'text/html') } as never, { globals: {} }), rule, 'test')
const value = (result: Awaited<ReturnType<typeof run>>, key: string) => result.presentation?.values.find((field) => field.key === key)?.value
const detail = (result: Awaited<ReturnType<typeof run>>, key: string) => result.presentation?.detailValues.find((field) => field.key === key)?.value

describe('rule: robots complexity', () => {
  afterEach(() => vi.restoreAllMocks())

  it('counts Disallow, Allow and Sitemap lines with their line numbers', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => 'User-agent: *\nDisallow: /a\nAllow: /b\nSitemap: https://ex.com/sitemap.xml' }))
    const result = await run('https://ex.com')
    expect(result.type).toBe('info'); expect(result.priority).toBe(800)
    expect(value(result, 'Disallow lines')).toBe(1)
    expect(value(result, 'Allow lines')).toBe(1)
    expect(value(result, 'Sitemap lines')).toBe(1)
    expect(detail(result, 'Total Disallow/Allow rules')).toBe(2)
    expect(result.presentation?.evidence).toEqual([
      { name: 'Line 2', fields: [{ key: 'Line', value: 2, kind: 'text' }, { key: 'Directive', value: 'Disallow', kind: 'text' }, { key: 'Content', value: 'Disallow: /a', kind: 'text' }] },
      { name: 'Line 3', fields: [{ key: 'Line', value: 3, kind: 'text' }, { key: 'Directive', value: 'Allow', kind: 'text' }, { key: 'Content', value: 'Allow: /b', kind: 'text' }] },
      { name: 'Line 4', fields: [{ key: 'Line', value: 4, kind: 'text' }, { key: 'Directive', value: 'Sitemap', kind: 'text' }, { key: 'Content', value: 'Sitemap: https://ex.com/sitemap.xml', kind: 'text' }] },
    ])
    expect(result.details).toBeUndefined()
    expect(toResultCopyPayload(result)).toContain(rule.meta.references[0])
  })

  it('reports not checked when robots.txt is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500, text: async () => '' }))
    const result = await run('https://down.test')
    expect(result.type).toBe('info'); expect(result.priority).toBe(850)
    expect(value(result, 'robots.txt complexity')).toBe('Not checked')
    expect(value(result, 'HTTP status')).toBe('HTTP 500 Internal Server Error')
  })

  it('reports not checked for an invalid page URL without fetching', async () => {
    const result = await run('not a url')
    expect(result.type).toBe('info'); expect(result.priority).toBe(900)
    expect(result.presentation?.input).toBe('Page URL')
  })
})
