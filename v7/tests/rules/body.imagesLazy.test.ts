import { describe, expect, it } from 'vitest'

import { enrichResult } from '@/core/runHelpers'
import { imagesLazyRule as rule } from '@/rules/body/imagesLazy'
import { toResultCopyPayload } from '@/components/result/resultCopy'

const run = async (html: string) => enrichResult(await rule.run({ html, url: 'https://example.test/', doc: new DOMParser().parseFromString(html, 'text/html') }, { globals: {} }), rule, 'test')
const value = (result: Awaited<ReturnType<typeof run>>, key: string) => result.presentation?.values.find((field) => field.key === key)?.value
const detail = (result: Awaited<ReturnType<typeof run>>, key: string) => result.presentation?.detailValues.find((field) => field.key === key)?.value

describe('images lazy-loading rule', () => {
  it('reports zero images for a document without images', async () => {
    const result = await run('')
    expect(result.type).toBe('info'); expect(result.priority).toBe(750)
    expect(value(result, 'Images')).toBe(0)
    expect(result.presentation?.markup).toEqual([])
    expect(result.details).toBeUndefined()
  })

  it('counts lazy, eager, and absent loading attributes with the markup in the overview', async () => {
    const html = '<img src="/lazy.jpg" alt="Lazy" loading="lazy"><img src="/eager.jpg" loading="eager"><img src="/default.jpg" alt="Default">'
    const result = await run(html)
    expect(result.type).toBe('info'); expect(result.priority).toBe(750)
    expect(value(result, 'Loading')).toBe('1 lazy, 1 eager, 1 unset')
    expect(result.presentation?.values.filter((field) => field.kind === 'original').map((field) => field.value)).toEqual([
      '<img src="/lazy.jpg" alt="Lazy" loading="lazy">', '<img src="/eager.jpg" loading="eager">', '<img src="/default.jpg" alt="Default">',
    ])
    expect(result.presentation?.evidence[2]?.fields.find((field) => field.key === 'loading')?.value).toBe('Not declared')
    expect(toResultCopyPayload(result)).toContain('/default.jpg')
    expect(toResultCopyPayload(result)).toContain(rule.meta.references[0])
  })

  it('treats an empty or non-lazy loading value as eager', async () => {
    const result = await run('<img loading=""><img loading="auto"><img loading="lazy">')
    expect(value(result, 'Loading')).toBe('1 lazy, 2 eager, 0 unset')
    expect(result.presentation?.evidence[0]?.fields.find((field) => field.key === 'loading')?.value).toBe('Empty')
  })

  it('shows a single image as its instruction plus its markup', async () => {
    const result = await run('<img src="/one.jpg" loading="lazy">')
    expect(value(result, 'Loading')).toBe('lazy')
    expect(value(result, '<img>')).toBe('<img src="/one.jpg" loading="lazy">')
  })

  it('uses a text field, never a url field, for a source that cannot resolve to http(s)', async () => {
    const result = await run('<img src="javascript:alert(1)" loading="lazy">')
    expect(result.presentation?.evidence[0]?.fields.find((field) => field.key === 'src')).toEqual({ key: 'src', value: 'javascript:alert(1)', kind: 'text' })
  })

  it('ships every image with truthful counts and summarizes the sources above three', async () => {
    const html = Array.from({ length: 11 }, (_, index) => `<img src="/image-${index + 1}.jpg" loading="lazy">`).join('')
    const result = await run(html)
    expect(value(result, 'Sources')).toBe('/image-1.jpg, /image-2.jpg, /image-3.jpg … 8 more')
    expect(detail(result, 'Evidence retained')).toBe(11); expect(detail(result, 'Markup omitted')).toBe(0)
    expect(result.presentation?.markup).toHaveLength(11)
  })

  it('bounds the alt excerpt and states unretained markup inside the record', async () => {
    const result = await run(`<img src="/big.jpg" loading="lazy" alt="${'x'.repeat(2000)}">`)
    expect(result.presentation?.evidence[0]?.fields[2]).toEqual({ key: 'alt', value: `${'x'.repeat(100)}…`, kind: 'text' })
    expect(result.presentation?.markup).toEqual([])
    expect(result.presentation?.evidence[0]?.fields).toContainEqual({ key: 'Markup', value: 'Not captured', kind: 'text' })
  })
})
