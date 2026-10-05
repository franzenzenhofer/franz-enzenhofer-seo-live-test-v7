import { afterEach, describe, expect, it, vi } from 'vitest'

import { robotsNoindexUnsupportedRule as rule } from '@/rules/robots/noindexUnsupported'
import { enrichResult } from '@/core/runHelpers'
import { toResultCopyPayload } from '@/components/result/resultCopy'

const run = async (url: string) => enrichResult(await rule.run({ html: '', url, doc: new DOMParser().parseFromString('<p/>', 'text/html') } as never, { globals: {} }), rule, 'test')
const value = (result: Awaited<ReturnType<typeof run>>, key: string) => result.presentation?.values.find((field) => field.key === key)?.value

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

const serve = (body: string, status = 200) =>
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: status < 400, status, text: async () => body }))

describe('rule: unsupported robots.txt noindex', () => {
  it('reports each unsupported noindex record with its line', async () => {
    serve('User-agent: *\nDisallow: /blocked/\nNoindex: /private/\n# Noindex: /commented/\nnoindex:/other\n')
    const result = await run('https://a.test/x')
    expect(result.type).toBe('warn'); expect(result.priority).toBe(200)
    expect(value(result, 'Noindex records')).toBe(2)
    expect(value(result, 'HTTP status')).toBe('HTTP 200 OK')
    expect(value(result, 'robots.txt URL')).toBe('https://a.test/robots.txt')
    expect(result.presentation?.evidence).toEqual([
      { name: 'Line 3', fields: [{ key: 'Directive', value: 'noindex', kind: 'text' }, { key: 'Value', value: '/private/', kind: 'text' }] },
      { name: 'Line 5', fields: [{ key: 'Directive', value: 'noindex', kind: 'text' }, { key: 'Value', value: '/other', kind: 'text' }] }])
    expect(result.details).toBeUndefined()
    expect(toResultCopyPayload(result)).toContain(rule.meta.references[0])
  })

  it('stays quiet on a robots.txt without noindex records', async () => {
    serve('User-agent: *\nDisallow: /blocked/\n')
    const result = await run('https://b.test/x')
    expect(result.type).toBe('info'); expect(result.priority).toBe(850)
    expect(value(result, 'Noindex records')).toBe(0)
    expect(result.presentation?.detailValues).toEqual([])
  })

  it('says so when robots.txt is unreachable instead of claiming a clean result', async () => {
    serve('', 404)
    const result = await run('https://c.test/x')
    expect(result.type).toBe('info'); expect(result.priority).toBe(900)
    expect(value(result, 'Noindex records')).toBe('Not checked')
    expect(value(result, 'HTTP status')).toBe('HTTP 404 Not Found')
    expect(result.presentation?.input).toBe('robots.txt response')
  })

  it('reports no response received on network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('boom')))
    const result = await run('https://netfail.test/x')
    expect(result.type).toBe('info'); expect(result.priority).toBe(900)
    expect(value(result, 'Response')).toBe('Not captured')
    expect(value(result, 'HTTP status')).toBeUndefined()
    expect(result.presentation?.input).toBe('Not captured')
  })

  it('reports not checked for a non-http(s) page URL without fetching', async () => {
    const result = await run('chrome://extensions')
    expect(result.type).toBe('info'); expect(result.priority).toBe(900)
    expect(value(result, 'Noindex records')).toBe('Not checked')
    expect(value(result, 'URL scheme')).toBe('chrome:')
    expect(result.presentation?.input).toBe('Page URL')
  })

  it('reports a runtime error when the page URL is not a valid URL', async () => {
    const result = await run('invalid URL')
    expect(result.type).toBe('runtime_error'); expect(result.priority).toBe(-1000)
    expect(result.presentation?.input).toBe('Page URL')
    expect(value(result, 'URL syntax')).toBe('Invalid')
  })

  it('caps reported occurrences at 20 and reports the omitted count', async () => {
    const body = `User-agent: *\n${Array.from({ length: 25 }, (_, i) => `noindex: /p${i}/`).join('\n')}`
    serve(body)
    const result = await run('https://many.test/x')
    expect(value(result, 'Noindex records')).toBe(25)
    expect(result.presentation?.detailValues.find((f) => f.key === 'Records listed')?.value).toBe(20)
    expect(result.presentation?.detailValues.find((f) => f.key === 'Records not listed')?.value).toBe(5)
    expect(result.presentation?.evidence).toHaveLength(20)
  })
})
