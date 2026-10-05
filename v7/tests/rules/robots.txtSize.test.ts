import { afterEach, describe, expect, it, vi } from 'vitest'

import { robotsTxtSizeRule as rule } from '@/rules/robots/robotsTxtSize'
import { enrichResult } from '@/core/runHelpers'
import { toResultCopyPayload } from '@/components/result/resultCopy'

const D = (h: string) => new DOMParser().parseFromString(h, 'text/html')
const run = async (url: string) => enrichResult(await rule.run({ html: '', url, doc: D('') } as never, { globals: {} }), rule, 'test')
const value = (result: Awaited<ReturnType<typeof run>>, key: string) => result.presentation?.values.find((field) => field.key === key)?.value
const detail = (result: Awaited<ReturnType<typeof run>>, key: string) => result.presentation?.detailValues.find((field) => field.key === key)?.value

describe('rule: robots txt size', () => {
  afterEach(() => vi.restoreAllMocks())

  it('warns when robots.txt reaches the 500 KiB limit Google reads', async () => {
    const large = 'a'.repeat(512001)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => large }))
    const result = await run('https://large.example')
    expect(result.type).toBe('warn'); expect(result.priority).toBe(220)
    // Only the first 500 KiB is read, so the rule reports the limit it hit -
    // never an exact size it never measured.
    expect(detail(result, 'Bytes read')).toBe('512000 bytes')
    expect(value(result, 'robots.txt size')).toBe('500 KiB or more')
    expect(value(result, 'Read limit')).toBe('Reached')
    expect(value(result, 'robots.txt URL')).toBe('https://large.example/robots.txt')
    expect(result.details).toBeUndefined()
    expect(toResultCopyPayload(result)).toContain(rule.meta.references[0])
  })

  it('reports info when robots.txt is within limit', async () => {
    const small = 'a'.repeat(1024)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => small }))
    const result = await run('https://small.example')
    expect(result.type).toBe('info'); expect(result.priority).toBe(820)
    expect(value(result, 'Read limit')).toBeUndefined()
    expect(value(result, 'robots.txt size')).toBe('1 KiB')
    expect(detail(result, 'Bytes read')).toBe('1024 bytes')
  })

  it('reports not checked when robots.txt is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404, text: async () => '' }))
    const result = await run('https://missing.example')
    expect(result.type).toBe('info'); expect(result.priority).toBe(850)
    expect(value(result, 'robots.txt size')).toBe('Not checked')
    expect(value(result, 'HTTP status')).toBe('HTTP 404 Not Found')
    expect(result.presentation?.input).toBe('robots.txt response')
  })

  it('skips a non-http(s) page URL without fetching', async () => {
    const result = await run('chrome://extensions')
    expect(result.type).toBe('info'); expect(result.priority).toBe(900)
    expect(value(result, 'Reason')).toContain('Skipped')
    expect(result.presentation?.input).toBe('Page URL')
  })
})
