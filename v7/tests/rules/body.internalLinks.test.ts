import { describe, expect, it } from 'vitest'

import { enrichResult } from '@/core/runHelpers'
import { internalLinksRule as rule } from '@/rules/body/internalLinks'
import { toResultCopyPayload } from '@/components/result/resultCopy'

const D = (h: string) => new DOMParser().parseFromString(h, 'text/html')
const run = async (html: string, url = 'https://example.test/a') => enrichResult(await rule.run({ html, url, doc: D(html) }, { globals: {} }), rule, 'test')
const value = (result: Awaited<ReturnType<typeof run>>, key: string) => result.presentation?.values.find((field) => field.key === key)?.value
const detail = (result: Awaited<ReturnType<typeof run>>, key: string) => result.presentation?.detailValues.find((field) => field.key === key)?.value

describe('internal links count rule', () => {
  it('reports zero counts when no href anchors are present', async () => {
    const result = await run('<p>none</p>')
    expect(result.type).toBe('info'); expect(result.priority).toBe(750)
    expect(value(result, 'Internal links')).toBe(0); expect(value(result, 'External links')).toBe(0)
    expect(result.presentation?.markup).toEqual([])
    expect(result.details).toBeUndefined()
  })

  it('counts same-host and cross-host destinations with labelled complete evidence', async () => {
    const html = '<a href="/x">Internal <em>one</em></a><a href="https://example.test/y">Internal two</a><a href="https://other.test/z">External</a>'
    const result = await run(html)
    expect(result.type).toBe('info'); expect(value(result, 'Internal links')).toBe(2); expect(value(result, 'External links')).toBe(1)
    expect(result.presentation?.input).toBe('Static DOM + Page URL')
    expect(result.presentation?.evidence[0]?.fields[0]).toEqual({ key: 'Link text (first 100 characters)', value: 'Internal one', kind: 'text' })
    expect(result.presentation?.markup.map((field) => field.value)).toEqual([
      '<a href="/x">Internal <em>one</em></a>', '<a href="https://example.test/y">Internal two</a>', '<a href="https://other.test/z">External</a>',
    ])
    expect(result.presentation?.evidence.map((record) => record.fields.find((field) => field.key === 'Category')?.value)).toEqual([
      'Same host', 'Same host', 'Cross host',
    ])
    expect(result.presentation?.evidence[1]?.fields.find((field) => field.key === 'Href')).toEqual({ key: 'Href', value: 'https://example.test/y', kind: 'url' })
    expect(detail(result, 'Internal examples retained')).toBe(2); expect(detail(result, 'External examples omitted')).toBe(0)
    expect(result.details).toBeUndefined(); expect(toResultCopyPayload(result)).toContain(rule.meta.references[0])
  })

  it('treats unparsable page URLs and hrefs as cross-host destinations', async () => {
    const result = await run('<a href="/local">Local</a><a href="//other.test/x">Other</a>', 'invalid page URL')
    expect(value(result, 'Internal links')).toBe(0); expect(value(result, 'External links')).toBe(2)
  })

  it('uses a text field, never a url field, for an href that cannot resolve to http(s)', async () => {
    const result = await run('<a href="javascript:void(0)">Go</a>')
    expect(result.presentation?.evidence[0]?.fields.find((field) => field.key === 'Href')).toEqual({ key: 'Href', value: 'javascript:void(0)', kind: 'text' })
  })

  it('bounds long link text to a labelled 100-character excerpt', async () => {
    const result = await run(`<a href="/x">${'a'.repeat(150)}</a>`)
    expect(result.presentation?.evidence[0]?.fields[0]).toEqual({ key: 'Link text (first 100 characters)', value: 'a'.repeat(100), kind: 'text' })
  })

  it('retains up to ten examples per category and reports both omissions', async () => {
    const internal = Array.from({ length: 11 }, (_, index) => `<a href="/internal-${index + 1}">I${index + 1}</a>`).join('')
    const external = Array.from({ length: 11 }, (_, index) => `<a href="https://other.test/external-${index + 1}">E${index + 1}</a>`).join('')
    const result = await run(internal + external)
    expect(detail(result, 'Internal examples retained')).toBe(10); expect(detail(result, 'Internal examples omitted')).toBe(1)
    expect(detail(result, 'External examples retained')).toBe(10); expect(detail(result, 'External examples omitted')).toBe(1)
    expect(result.presentation?.markup).toHaveLength(20)
  })
})
