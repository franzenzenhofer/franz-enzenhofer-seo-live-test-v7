import { describe, expect, it } from 'vitest'

import { enrichResult } from '@/core/runHelpers'
import { discoverAuthorPresentRule as rule } from '@/rules/discover/authorPresent'
import { presentationSchema } from '@/shared/presentation/schema'
import { toResultCopyPayload } from '@/components/result/resultCopy'
const run = async (html: string) => enrichResult(await rule.run({
  html, url: 'https://example.test/', doc: new DOMParser().parseFromString(html, 'text/html'),
}, { globals: {} }), rule, 'test')
const value = (result: Awaited<ReturnType<typeof run>>, key: string) => result.presentation?.values.find((field) => field.key === key)?.value

describe('author metadata rule', () => {
  it('reports names from meta and the matching JSON-LD script with complete markup', async () => {
    const html = '<script type="application/ld+json">{"@type":"Organization"}</script><script type="application/ld+json" data-origin="cms">{"@type":"Article","author":[{"name":"Jane"},{"name":"John"}]}</script><meta name="author" data-source="cms" content="Jane">'
    const result = await run(html)
    expect(result.type).toBe('info')
    expect(value(result, 'Author names')).toBe('Jane, John')
    expect(value(result, 'Author declarations')).toBe(3)
    expect(result.presentation?.input).toBe('Idle DOM')
    expect(result.presentation?.markup.map((field) => field.value)).toEqual([
      '<meta name="author" data-source="cms" content="Jane">',
      '<script type="application/ld+json">{"@type":"Organization"}</script>',
      '<script type="application/ld+json" data-origin="cms">{"@type":"Article","author":[{"name":"Jane"},{"name":"John"}]}</script>',
    ])
    expect(result.presentation?.evidence.slice(0, 3).map((record) => record.fields[1]?.value)).toEqual([
      'Author meta tag', 'JSON-LD script 2', 'JSON-LD script 2',
    ])
    expect(result.details).toBeUndefined()
    expect(presentationSchema.safeParse(result.presentation).success).toBe(true)
    const copied = toResultCopyPayload(result)
    expect(copied).toContain('Jane'); expect(copied).toContain('John')
    expect(copied).toContain(rule.meta.references[1]); expect(copied).not.toContain('[object Object]')
  })

  it('reports absent and empty author declarations as informational observations', async () => {
    const absent = await run('')
    expect(absent.type).toBe('info'); expect(value(absent, 'Author declarations')).toBe(0)
    expect(absent.presentation?.markup).toEqual([])
    const empty = await run('<meta name="author" content="  ">')
    expect(empty.type).toBe('info'); expect(value(empty, 'Author names')).toBe('None found')
    expect(value(empty, 'Author declarations')).toBe(0)
    expect(empty.presentation?.markup[0].value).toBe('<meta name="author" content="  ">')
  })

  it('flattens named author objects, arrays, and strings while ignoring unresolved references', async () => {
    const result = await run('<script type="application/ld+json">{"author":[{"name":"Jane"}," John ",{"name":"Jane"},{"@id":"#person"}]}</script>')
    expect(result.type).toBe('info')
    expect(value(result, 'Author names')).toBe('Jane, John')
    expect(value(result, 'Author declarations')).toBe(3)
    expect(result.presentation?.evidence.slice(0, 3).map((record) => record.fields[0]?.value)).toEqual(['Jane', 'John', 'Jane'])
  })

  it('warns for malformed JSON-LD and keeps its exact source markup', async () => {
    const html = '<meta name="author" content="Jane"><script type="application/ld+json" data-broken="yes">broken</script>'
    const result = await run(html)
    expect(result.type).toBe('warn')
    expect(value(result, 'JSON-LD parse errors')).toBe(1)
    expect(result.presentation?.markup.map((field) => field.value)).toEqual([
      '<meta name="author" content="Jane">',
      '<script type="application/ld+json" data-broken="yes">broken</script>',
    ])
    expect(result.presentation?.evidence.find((record) => record.name === 'JSON-LD parse error 1')?.fields[1]?.key).toBe('Parse error excerpt')
    expect(toResultCopyPayload(result)).toContain('JSON-LD parse error 1')
  })
})
