import { afterEach, describe, expect, it, vi } from 'vitest'

import { robotsTxtRule as rule } from '@/rules/robots/robotsTxt'
import { enrichResult } from '@/core/runHelpers'
import { toResultCopyPayload } from '@/components/result/resultCopy'

const D = () => new DOMParser().parseFromString('<p/>', 'text/html')
const run = async (url: string) => enrichResult(await rule.run({ html: '', url, doc: D() } as never, { globals: {} }), rule, 'test')
const stub = (status: number, text = '') =>
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: status >= 200 && status < 300, status, text: async () => text }))
const value = (result: Awaited<ReturnType<typeof run>>, key: string) => result.presentation?.values.find((field) => field.key === key)?.value

describe('rule: robots.txt exists', () => {
  afterEach(() => vi.restoreAllMocks())

  it('reports info when robots.txt exists (2xx)', async () => {
    stub(200, 'User-agent: *\nDisallow:')
    const result = await run('https://exists.test/a')
    expect(result.type).toBe('info'); expect(result.priority).toBe(800)
    expect(value(result, 'robots.txt')).toBe('Found')
    expect(result.presentation?.evidence[0]?.fields).toContainEqual(expect.objectContaining({ key: 'robots.txt URL', value: 'https://exists.test/robots.txt' }))
    expect(result.presentation?.markup).toHaveLength(0)
    expect(result.presentation?.noMarkup).toContain('robots.txt')
    expect(result.details).toBeUndefined()
    expect(toResultCopyPayload(result)).toContain(rule.meta.references[0])
  })

  it('treats 404 as valid allow-all state (info, not warn)', async () => {
    stub(404)
    const result = await run('https://missing.test/a')
    expect(result.type).toBe('info'); expect(result.priority).toBe(800)
    expect(value(result, 'robots.txt')).toBe('Not found')
    expect(value(result, 'HTTP status')).toBe('HTTP 404 Not Found')
  })

  it('warns on 5xx (Google may assume complete disallow)', async () => {
    stub(500)
    const result = await run('https://servererror.test/a')
    expect(result.type).toBe('warn'); expect(result.priority).toBe(300)
    expect(value(result, 'robots.txt')).toBe('Unreachable')
    expect(result.presentation?.evidence[0]?.fields).toContainEqual(expect.objectContaining({ key: 'HTTP status', value: 'HTTP 500 Internal Server Error' }))
  })

  it('warns on 429 like a server error, not like 404', async () => {
    stub(429)
    const result = await run('https://ratelimited.test/a')
    expect(result.type).toBe('warn'); expect(result.priority).toBe(300)
    expect(value(result, 'robots.txt')).toBe('Unreachable')
  })

  it('warns on network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('boom')))
    const result = await run('https://netfail.test/a')
    expect(result.type).toBe('warn'); expect(result.priority).toBe(350)
    expect(value(result, 'robots.txt')).toBe('Unreachable')
    expect(result.presentation?.input).toBe('Not captured')
  })

  it('reports info for an invalid/unsupported page URL without attempting a fetch', async () => {
    const result = await run('chrome://extensions')
    expect(result.type).toBe('info'); expect(result.priority).toBe(900)
    expect(value(result, 'robots.txt')).toBe('Not checked')
    expect(result.presentation?.input).toBe('Page URL')
  })
})
