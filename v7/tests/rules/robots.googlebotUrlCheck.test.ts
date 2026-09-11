import { afterEach, describe, expect, it, vi } from 'vitest'

import { googlebotUrlCheckRule as rule } from '@/rules/robots/googlebotUrlCheck'
import { enrichResult } from '@/core/runHelpers'
import { toResultCopyPayload } from '@/components/result/resultCopy'

const run = async (url: string) => enrichResult(await rule.run({ html: '', url, doc: new DOMParser().parseFromString('<p/>', 'text/html') } as never, { globals: {} }), rule, 'test')
const value = (result: Awaited<ReturnType<typeof run>>, key: string) => result.presentation?.values.find((field) => field.key === key)?.value
const serve = (txt: string, status = 200) => vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: status < 400, status, text: async () => txt }))

describe('rule: googlebot url check', () => {
  afterEach(() => vi.restoreAllMocks())

  it('reports allowed and names the matching Allow rule and its line', async () => {
    serve('User-agent: *\nAllow: /')
    const result = await run('https://allow.test/a')
    expect(result.type).toBe('ok'); expect(result.priority).toBe(800)
    expect(value(result, 'Googlebot crawl permission')).toBe('Allowed')
    expect(result.presentation?.evidence[0]).toEqual({ name: 'Applicable user-agent group', fields: [{ key: 'Group', value: '*', kind: 'text' }] })
    expect(result.presentation?.evidence[1]).toEqual({ name: 'Line 2', fields: [
      { key: 'Line', value: 2, kind: 'text' }, { key: 'Directive', value: 'Allow', kind: 'text' }, { key: 'Value', value: '/', kind: 'text' }] })
    expect(result.details).toBeUndefined()
    expect(toResultCopyPayload(result)).toContain(rule.meta.references[0])
  })

  it('reports disallowed and names the matching Disallow rule', async () => {
    serve('User-agent: Googlebot\nDisallow: /private')
    const result = await run('https://disallow.test/private/page')
    expect(result.type).toBe('error'); expect(result.priority).toBe(60)
    expect(value(result, 'Googlebot crawl permission')).toBe('Disallowed')
    expect(result.presentation?.evidence.find((e) => e.name === 'Line 2')?.fields).toContainEqual({ key: 'Directive', value: 'Disallow', kind: 'text' })
  })

  it('reports the default-allow state when no rule matches the path', async () => {
    serve('User-agent: *\nDisallow: /blocked')
    const result = await run('https://defaultallow.test/open')
    expect(result.type).toBe('ok')
    expect(result.presentation?.evidence[0]?.fields).toContainEqual({ key: 'Matching rule', value: 'None - default allow applies', kind: 'text' })
  })

  it('treats a 404 robots.txt as allow-all', async () => {
    serve('', 404)
    const result = await run('https://notfound.test/anything')
    expect(result.type).toBe('ok')
    expect(value(result, 'HTTP status')).toBe('HTTP 404 Not Found')
  })

  it('reports not checked when robots.txt is unavailable (5xx)', async () => {
    serve('', 500)
    const result = await run('https://servererror.test/a')
    expect(result.type).toBe('info'); expect(result.priority).toBe(850)
    expect(value(result, 'Googlebot crawl permission')).toBe('Not checked')
  })

  it('reports not checked for an invalid page URL without fetching', async () => {
    const result = await run('not a url')
    expect(result.type).toBe('info'); expect(result.priority).toBe(900)
    expect(result.presentation?.input).toBe('Page URL')
  })
})
