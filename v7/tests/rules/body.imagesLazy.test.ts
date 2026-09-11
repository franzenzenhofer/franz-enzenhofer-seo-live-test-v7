import { describe, expect, it } from 'vitest'

import { enrichResult } from '@/core/runHelpers'
import { imagesLazyRule as rule } from '@/rules/body/imagesLazy'
import { toResultCopyPayload } from '@/components/result/resultCopy'

const run = async (html: string) => enrichResult(await rule.run({ html, url: 'https://example.test/', doc: new DOMParser().parseFromString(html, 'text/html') }, { globals: {} }), rule, 'test')
const value = (result: Awaited<ReturnType<typeof run>>, key: string) => result.presentation?.values.find((field) => field.key === key)?.value
const detail = (result: Awaited<ReturnType<typeof run>>, key: string) => result.presentation?.detailValues.find((field) => field.key === key)?.value

describe('images lazy-loading rule', () => {
  it('reports zero counts for a document without images', async () => {
    const result = await run('')
    expect(result.type).toBe('info'); expect(result.priority).toBe(750)
    expect(value(result, 'Lazy images')).toBe(0)
    expect(value(result, 'Eager images')).toBe(0); expect(value(result, 'Unset loading')).toBe(0)
    expect(result.presentation?.markup).toEqual([])
    expect(result.details).toBeUndefined()
  })

  it('counts lazy, eager, and absent loading attributes with exact evidence', async () => {
    const html = '<img src="/lazy.jpg" alt="Lazy" loading="lazy"><img src="/eager.jpg" loading="eager"><img src="/default.jpg" alt="Default">'
    const result = await run(html)
    expect(result.type).toBe('info'); expect(result.priority).toBe(750)
    expect(value(result, 'Lazy images')).toBe(1); expect(value(result, 'Eager images')).toBe(1); expect(value(result, 'Unset loading')).toBe(1)
    expect(result.presentation?.markup.map((field) => field.value)).toEqual([
      '<img src="/lazy.jpg" alt="Lazy" loading="lazy">', '<img src="/eager.jpg" loading="eager">', '<img src="/default.jpg" alt="Default">',
    ])
    expect(result.presentation?.evidence[2]?.fields.find((field) => field.key === 'Loading instruction')?.value).toBe('(omitted: eager by default)')
    expect(toResultCopyPayload(result)).toContain('/default.jpg')
    expect(toResultCopyPayload(result)).toContain(rule.meta.references[0])
  })

  it('treats an empty or non-lazy loading value as eager', async () => {
    const result = await run('<img loading=""><img loading="auto"><img loading="lazy">')
    expect(value(result, 'Lazy images')).toBe(1); expect(value(result, 'Eager images')).toBe(2); expect(value(result, 'Unset loading')).toBe(0)
  })

  it('uses a text field, never a url field, for a source that cannot resolve to http(s)', async () => {
    const result = await run('<img src="javascript:alert(1)" loading="lazy">')
    expect(result.presentation?.evidence[0]?.fields.find((field) => field.key === 'Source URL')).toEqual({ key: 'Source URL', value: 'javascript:alert(1)', kind: 'text' })
  })

  it('retains a bounded sample and reports omitted image elements', async () => {
    const html = Array.from({ length: 11 }, (_, index) => `<img src="/image-${index + 1}.jpg" loading="lazy">`).join('')
    const result = await run(html)
    expect(detail(result, 'Image elements retained')).toBe(10); expect(detail(result, 'Image elements omitted')).toBe(1)
    expect(result.presentation?.markup).toHaveLength(10)
  })

  it('labels the bounded alt excerpt and states unretained markup', async () => {
    const result = await run(`<img src="/big.jpg" loading="lazy" alt="${'x'.repeat(2000)}">`)
    expect(result.presentation?.evidence[0]?.fields[2]).toEqual({ key: 'Alt text (first 100 characters)', value: `${'x'.repeat(100)}…`, kind: 'text' })
    expect(result.presentation?.markup).toEqual([])
    expect(result.presentation?.evidence.find((record) => record.name === 'Capture status')?.fields).toEqual([{ key: 'Image markup 1', value: 'Complete original markup not retained', kind: 'text' }])
  })
})
