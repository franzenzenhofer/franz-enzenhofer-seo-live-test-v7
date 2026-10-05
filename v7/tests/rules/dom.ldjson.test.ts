import { describe, expect, it } from 'vitest'

import { enrichResult } from '@/core/runHelpers'
import { ldjsonRule as rule } from '@/rules/dom/ldjson'
import { presentationSchema } from '@/shared/presentation/schema'
import { toResultCopyPayload } from '@/components/result/resultCopy'

const doc = (h: string) => new DOMParser().parseFromString(h, 'text/html')
const run = async (html: string) => enrichResult(await rule.run({ html, url: 'https://example.test/', doc: doc(html) }, { globals: {} }), rule, 'test')
const value = (result: Awaited<ReturnType<typeof run>>, key: string) => result.presentation?.values.find((field) => field.key === key)?.value
const detail = (result: Awaited<ReturnType<typeof run>>, key: string) => result.presentation?.detailValues.find((field) => field.key === key)?.value

describe('JSON-LD structured data blocks rule', () => {
  it('reports no blocks as an informational observation', async () => {
    const result = await run('')
    expect(result.type).toBe('info'); expect(result.priority).toBe(750)
    expect(result.presentation?.values).toEqual([{ key: 'JSON-LD scripts', value: 'Not found', kind: 'text' }])
    expect(result.presentation?.markup).toEqual([]); expect(result.presentation?.detailValues).toEqual([])
    expect(result.presentation?.input).toBe('Idle DOM')
    expect(presentationSchema.safeParse(result.presentation).success).toBe(true)
  })

  it('reports declared types as derived text and preserves full script markup', async () => {
    const html = '<script type="application/ld+json" data-origin="cms">{"@type":["Article",{}]}</script>'
    const result = await run(html)
    expect(result.type).toBe('info')
    // A single script is never a count of 1: its types and its original markup are the overview.
    expect(result.presentation?.values).toEqual([
      { key: 'Types', value: 'Article', kind: 'text' }, { key: '<script type="application/ld+json">', value: html, kind: 'original', fidelity: 'complete-original' },
    ])
    expect(result.presentation?.markup[0].value).toBe(html)
    expect(result.presentation?.evidence).toEqual([{ name: '<script type="application/ld+json">', fields: [
      { key: 'Types', value: 'Article', kind: 'text' }, expect.objectContaining({ key: 'DOM path', kind: 'path' }),
    ] }])
    expect(detail(result, 'Markup retained')).toBe(1); expect(detail(result, 'Evidence retained')).toBe(1)
    expect(result.details).toBeUndefined(); expect(toResultCopyPayload(result)).toContain(rule.meta.references[1])
  })

  it('warns for malformed and empty JSON-LD blocks while retaining their exact source', async () => {
    const html = '<script type="application/ld+json" data-broken="yes">broken</script><script type="application/ld+json"></script>'
    const result = await run(html)
    expect(result.type).toBe('warn'); expect(result.priority).toBe(300)
    expect(value(result, 'JSON-LD scripts')).toBe(2); expect(value(result, 'Parse errors')).toBe('scripts 1, 2')
    expect(result.presentation?.markup.map((field) => field.value)).toEqual([
      '<script type="application/ld+json" data-broken="yes">broken</script>', '<script type="application/ld+json"></script>',
    ])
    expect(result.presentation?.evidence[0]?.fields.find((field) => field.key === 'Syntax')?.value).toBe('Invalid JSON')
    expect(toResultCopyPayload(result)).toContain('Unexpected token')
  })

  it('retains a bounded script sample and reports omitted blocks', async () => {
    const html = Array.from({ length: 11 }, (_, index) => `<script type="application/ld+json">{"@type":"Thing${index + 1}"}</script>`).join('')
    const result = await run(html)
    expect(value(result, 'JSON-LD scripts')).toBe(11); expect(value(result, 'Types')).toBe('Thing1, Thing2, Thing3, Thing4, Thing5, Thing6 … 5 more')
    expect(detail(result, 'Markup retained')).toBe(10); expect(detail(result, 'Markup omitted')).toBe(1)
    expect(detail(result, 'Evidence retained')).toBe(10); expect(detail(result, 'Evidence omitted')).toBe(1)
    expect(result.presentation?.markup).toHaveLength(10); expect(result.presentation?.evidence).toHaveLength(10)
    // Eleven scripts exceed the overview budget: no original field in the overview, all in details.
    expect(result.presentation?.values.some((field) => field.kind === 'original')).toBe(false)
  })
})
