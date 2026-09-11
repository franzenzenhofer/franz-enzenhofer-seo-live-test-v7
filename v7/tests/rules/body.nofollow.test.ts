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

  it('reports matching links with exact values and complete markup', async () => {
    const html = '<a rel="ugc nofollow" href="https://example.test/out" aria-label="Read more"> Read <em>more</em> </a>'
    const result = await run(html)
    expect(result.type).toBe('info'); expect(result.priority).toBe(700); expect(value(result, 'Nofollow links')).toBe(1)
    expect(result.presentation?.markup[0].value).toBe(html)
    expect(result.presentation?.evidence[0]?.fields.map((field) => field.value)).toEqual([
      'Read more', 'https://example.test/out', 'ugc nofollow', 'html > body > a',
    ])
    expect(result.presentation?.evidence[0]?.fields[1]).toEqual({ key: 'Href', value: 'https://example.test/out', kind: 'url' })
    expect(detail(result, 'Examples retained')).toBe(1); expect(detail(result, 'Examples omitted')).toBe(0)
    expect(result.details).toBeUndefined(); expect(toResultCopyPayload(result)).toContain(rule.meta.references[0])
  })

  it('uses a text field, never a url field, for an href that cannot resolve to http(s)', async () => {
    const result = await run('<a rel="nofollow" href="javascript:void(0)">Go</a>')
    expect(result.presentation?.evidence[0]?.fields.find((field) => field.key === 'Href')).toEqual({ key: 'Href', value: 'javascript:void(0)', kind: 'text' })
  })

  it('bounds matching link evidence and reports omitted records', async () => {
    const html = Array.from({ length: 11 }, (_, index) => `<a rel="nofollow" href="/link-${index + 1}">Link ${index + 1}</a>`).join('')
    const result = await run(html)
    expect(value(result, 'Nofollow links')).toBe(11)
    expect(detail(result, 'Examples retained')).toBe(10); expect(detail(result, 'Examples omitted')).toBe(1)
    expect(result.presentation?.markup).toHaveLength(10)
  })

  it('labels the bounded link text excerpt and states unretained markup', async () => {
    const result = await run(`<a rel="nofollow" href="/big">${'x'.repeat(2000)}</a>`)
    expect(result.presentation?.evidence[0]?.fields[0]).toEqual({ key: 'Link text (whitespace collapsed, first 100 characters)', value: `${'x'.repeat(100)}…`, kind: 'text' })
    expect(result.presentation?.markup).toEqual([])
    expect(result.presentation?.evidence.find((record) => record.name === 'Capture status')?.fields).toEqual([{ key: 'Nofollow link markup 1', value: 'Complete original markup not retained', kind: 'text' }])
  })
})
