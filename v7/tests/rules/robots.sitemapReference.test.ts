import { afterEach, describe, expect, it, vi } from 'vitest'

import { robotsSitemapReferenceRule as rule } from '@/rules/robots/sitemapReference'
import { enrichResult } from '@/core/runHelpers'
import { toResultCopyPayload } from '@/components/result/resultCopy'

const D = () => new DOMParser().parseFromString('<p/>', 'text/html')
const run = async (url: string) => enrichResult(await rule.run({ html: '', url, doc: D() } as never, { globals: {} }), rule, 'test')
const stub = (txt: string) => vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => txt }))
const value = (result: Awaited<ReturnType<typeof run>>, key: string) => result.presentation?.values.find((field) => field.key === key)?.value

describe('rule: robots sitemap reference', () => {
  afterEach(() => vi.restoreAllMocks())

  it('reports ok for a fully qualified sitemap URL', async () => {
    stub('Sitemap: https://ex.com/sitemap.xml')
    const result = await run('https://ex.com/a')
    expect(result.type).toBe('ok'); expect(result.priority).toBe(820)
    expect(value(result, 'Sitemap references')).toBe(1)
    expect(result.presentation?.evidence[0]).toEqual({ name: 'Line 1', fields: [
      { key: 'Line', value: 1, kind: 'text' }, { key: 'Sitemap URL', value: 'https://ex.com/sitemap.xml', kind: 'url' },
      { key: 'Valid', value: 'Yes', kind: 'text' }] })
    expect(result.details).toBeUndefined()
    expect(toResultCopyPayload(result)).toContain(rule.meta.references[0])
  })

  it('reports info (not warn) when no sitemap is declared - other submission methods exist', async () => {
    stub('User-agent: *\nDisallow:')
    const result = await run('https://nosm.test/a')
    expect(result.type).toBe('info'); expect(result.priority).toBe(820)
    expect(value(result, 'Sitemap references')).toBe(0)
  })

  it('warns on a relative sitemap value (must be a fully qualified URL)', async () => {
    stub('Sitemap: /sitemap.xml')
    const result = await run('https://relsm.test/a')
    expect(result.type).toBe('warn'); expect(result.priority).toBe(400)
    expect(value(result, 'Invalid values')).toBe(1)
    expect(result.presentation?.evidence[0]?.fields).toContainEqual({ key: 'Sitemap value', value: '/sitemap.xml', kind: 'text' })
  })

  it('warns when valid and invalid sitemap values are mixed', async () => {
    stub('Sitemap: https://mixsm.test/sitemap.xml\nSitemap: sitemap-2.xml')
    const result = await run('https://mixsm.test/a')
    expect(result.type).toBe('warn')
    expect(value(result, 'Sitemap references')).toBe(2)
    expect(value(result, 'Invalid values')).toBe(1)
    expect(result.presentation?.evidence).toHaveLength(2)
    expect(result.presentation?.evidence[0]?.name).toBe('Line 1')
    expect(result.presentation?.evidence[1]?.name).toBe('Line 2')
  })

  it('reports not checked when robots.txt is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404, text: async () => '' }))
    const result = await run('https://missing.test/a')
    expect(result.type).toBe('info'); expect(result.priority).toBe(850)
    expect(value(result, 'HTTP status')).toBe('HTTP 404 Not Found')
  })

  it('skips a non-http(s) page URL without fetching', async () => {
    const result = await run('chrome://extensions')
    expect(result.type).toBe('info'); expect(result.priority).toBe(900)
    expect(result.presentation?.input).toBe('Page URL')
  })
})
