import { describe, expect, it } from 'vitest'

import { enrichResult } from '@/core/runHelpers'
import { nofollowRule as rule } from '@/rules/body/nofollow'
import { toResultCopyPayload } from '@/components/result/resultCopy'

const doc = (h: string) => new DOMParser().parseFromString(h, 'text/html')
const run = async (html: string) => enrichResult(await rule.run({ html, url: 'https://example.test/', doc: doc(html) }, { globals: {} }), rule, 'test')
const value = (result: Awaited<ReturnType<typeof run>>, key: string) => result.presentation?.values.find((field) => field.key === key)?.value
const detail = (result: Awaited<ReturnType<typeof run>>, key: string) => result.presentation?.detailValues.find((field) => field.key === key)?.value

describe('nofollow links rule', () => {
  it('reports no matching links as an ok result without markup', async () => {
    const result = await run('<a href="/">x</a>')
    expect(result.type).toBe('ok'); expect(result.priority).toBe(850); expect(value(result, 'Nofollow links')).toBe(0)
    expect(result.presentation?.markup).toEqual([])
    expect(result.details).toBeUndefined()
  })

  it('reports a matching link with exact values and its complete markup as the overview', async () => {
    const html = '<a rel="ugc nofollow" href="https://example.test/out" aria-label="Read more"> Read <em>more</em> </a>'
    const result = await run(html)
    expect(result.type).toBe('info'); expect(result.priority).toBe(700)
    expect(result.presentation?.values).toEqual([{ key: '<a rel="ugc nofollow">', value: html, kind: 'original', fidelity: 'complete-original' }])
    expect(result.presentation?.markup[0].value).toBe(html)
    expect(result.presentation?.evidence[0]?.fields.map((field) => field.value)).toEqual([
      'Read more', 'https://example.test/out', 'ugc nofollow', 'html > body > a',
    ])
    expect(result.presentation?.evidence[0]?.fields[1]).toEqual({ key: 'href', value: 'https://example.test/out', kind: 'url' })
    expect(detail(result, 'Evidence retained')).toBe(1); expect(detail(result, 'Evidence omitted')).toBe(0)
    expect(result.details).toBeUndefined(); expect(toResultCopyPayload(result)).toContain(rule.meta.references[0])
  })

  it('uses a text field, never a url field, for an href that cannot resolve to http(s)', async () => {
    const result = await run('<a rel="nofollow" href="javascript:void(0)">Go</a>')
    expect(result.presentation?.evidence[0]?.fields.find((field) => field.key === 'href')).toEqual({ key: 'href', value: 'javascript:void(0)', kind: 'text' })
  })

  it('bounds matching link evidence, summarizes the targets and reports omitted records', async () => {
    const html = Array.from({ length: 11 }, (_, index) => `<a rel="nofollow" href="/link-${index + 1}">Link ${index + 1}</a>`).join('')
    const result = await run(html)
    expect(value(result, 'Nofollow links')).toBe(11)
    expect(value(result, 'Targets')).toBe('/link-1, /link-2, /link-3, /link-4, /link-5 … 5 more')
    expect(detail(result, 'Evidence retained')).toBe(10); expect(detail(result, 'Evidence omitted')).toBe(1)
    expect(result.presentation?.markup).toHaveLength(10)
  })

  it('bounds the link text excerpt and states unretained markup inside the record', async () => {
    const result = await run(`<a rel="nofollow" href="/big">${'x'.repeat(2000)}</a>`)
    expect(result.presentation?.evidence[0]?.fields[0]).toEqual({ key: 'Text', value: `${'x'.repeat(100)}…`, kind: 'text' })
    expect(result.presentation?.markup).toEqual([])
    expect(result.presentation?.evidence[0]?.fields).toContainEqual({ key: 'Markup', value: 'Not captured', kind: 'text' })
  })
})
