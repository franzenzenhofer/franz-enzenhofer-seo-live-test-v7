import { describe, expect, it } from 'vitest'

import { enrichResult } from '@/core/runHelpers'
import { discoverAuthorPresentRule as rule } from '@/rules/discover/authorPresent'
import { presentationSchema } from '@/shared/presentation/schema'
import { toResultCopyPayload } from '@/components/result/resultCopy'
const run = async (html: string) => enrichResult(await rule.run({
  html, url: 'https://example.test/', doc: new DOMParser().parseFromString(html, 'text/html'),
}, { globals: {} }), rule, 'test')
const value = (result: Awaited<ReturnType<typeof run>>, key: string) => result.presentation?.values.find((field) => field.key === key)?.value
const detail = (result: Awaited<ReturnType<typeof run>>, key: string) => result.presentation?.detailValues.find((field) => field.key === key)?.value

describe('author metadata rule', () => {
  it('reports names from meta and the matching JSON-LD script with complete markup', async () => {
    const html = '<script type="application/ld+json">{"@type":"Organization"}</script><script type="application/ld+json" data-origin="cms">{"@type":"Article","author":[{"name":"Jane"},{"name":"John"}]}</script><meta name="author" data-source="cms" content="Jane">'
    const result = await run(html)
    expect(result.type).toBe('info')
    expect(value(result, 'Author names')).toBe('Jane, John')
    expect(detail(result, 'Author declarations')).toBe(3)
    expect(result.presentation?.input).toBe('Idle DOM')
    expect(result.presentation?.markup.map((field) => field.value)).toEqual([
      '<meta name="author" data-source="cms" content="Jane">',
      '<script type="application/ld+json">{"@type":"Organization"}</script>',
      '<script type="application/ld+json" data-origin="cms">{"@type":"Article","author":[{"name":"Jane"},{"name":"John"}]}</script>',
    ])
    expect(result.presentation?.evidence.map((record) => [record.name, record.fields[0]?.value])).toEqual([
      ['<meta name="author">', 'Jane'], ['<script type="application/ld+json"> 1', 'Not found'], ['<script type="application/ld+json"> 2', 'Jane, John'],
    ])
    expect(result.presentation?.values.filter((field) => field.kind === 'original')).toHaveLength(3)
    expect(result.details).toBeUndefined()
    expect(presentationSchema.safeParse(result.presentation).success).toBe(true)
    const copied = toResultCopyPayload(result)
    expect(copied).toContain('Jane'); expect(copied).toContain('John')
    expect(copied).toContain(rule.meta.references[1]); expect(copied).not.toContain('[object Object]')
  })

  it('reports absent and empty author declarations as informational observations', async () => {
    const absent = await run('')
    expect(absent.type).toBe('info'); expect(detail(absent, 'Author declarations')).toBe(0)
    expect(value(absent, 'Author names')).toBe('Not found')
    expect(absent.presentation?.markup).toEqual([])
    const empty = await run('<meta name="author" content="  ">')
    expect(empty.type).toBe('info'); expect(value(empty, 'Author names')).toBe('Not found')
    expect(detail(empty, 'Author declarations')).toBe(0)
    expect(empty.presentation?.markup[0].value).toBe('<meta name="author" content="  ">')
  })

  it('flattens named author objects, arrays, and strings while ignoring unresolved references', async () => {
    const result = await run('<script type="application/ld+json">{"author":[{"name":"Jane"}," John ",{"name":"Jane"},{"@id":"#person"}]}</script>')
    expect(result.type).toBe('info')
    expect(value(result, 'Author names')).toBe('Jane, John')
    expect(detail(result, 'Author declarations')).toBe(3)
    expect(result.presentation?.evidence[0]?.fields[0]?.value).toBe('Jane, John, Jane')
  })

  it('warns for malformed JSON-LD and keeps its exact source markup', async () => {
    const html = '<meta name="author" content="Jane"><script type="application/ld+json" data-broken="yes">broken</script>'
    const result = await run(html)
    expect(result.type).toBe('warn')
    expect(value(result, 'JSON-LD parse errors')).toBe('script 1')
    expect(result.presentation?.markup.map((field) => field.value)).toEqual([
      '<meta name="author" content="Jane">',
      '<script type="application/ld+json" data-broken="yes">broken</script>',
    ])
    expect(result.presentation?.evidence.find((record) => record.name === '<script type="application/ld+json">')?.fields[1]?.key).toBe('Parse error')
    expect(toResultCopyPayload(result)).toContain('Parse error:')
  })
})
