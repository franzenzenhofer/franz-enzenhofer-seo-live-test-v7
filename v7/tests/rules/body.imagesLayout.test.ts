import { describe, expect, it } from 'vitest'

import { enrichResult } from '@/core/runHelpers'
import { imagesLayoutRule as rule } from '@/rules/body/imagesLayout'
import { toResultCopyPayload } from '@/components/result/resultCopy'

const run = async (html: string) => enrichResult(await rule.run({ html, url: 'https://example.test/', doc: new DOMParser().parseFromString(html, 'text/html') }, { globals: {} }), rule, 'test')
const value = (result: Awaited<ReturnType<typeof run>>, key: string) => result.presentation?.values.find((field) => field.key === key)?.value
const detail = (result: Awaited<ReturnType<typeof run>>, key: string) => result.presentation?.detailValues.find((field) => field.key === key)?.value

describe('image dimension attributes rule', () => {
  it('reports an empty document as informational with zero counts', async () => {
    const result = await run('')
    expect(result.type).toBe('info'); expect(result.priority).toBe(850)
    expect(value(result, 'Images checked')).toBe(0); expect(value(result, 'Missing dimensions')).toBe(0)
    expect(result.presentation?.markup).toEqual([])
    expect(result.details).toBeUndefined()
  })

  it('reports each missing dimension and shows the complete source markup in the overview', async () => {
    const html = '<img src="/trip.jpg" alt="Trip" width="1200"><img src="/map.jpg" alt="Map">'
    const result = await run(html)
    expect(result.type).toBe('warn'); expect(result.priority).toBe(300)
    expect(value(result, 'Images checked')).toBe(2); expect(value(result, 'Missing dimensions')).toBe(2)
    expect(result.presentation?.values.filter((field) => field.kind === 'original').map((field) => field.value)).toEqual([
      '<img src="/trip.jpg" alt="Trip" width="1200">', '<img src="/map.jpg" alt="Map">',
    ])
    expect(result.presentation?.markup.map((field) => field.key)).toEqual(['<img> 1', '<img> 2'])
    expect(result.presentation?.evidence[0]?.fields.find((field) => field.key === 'Missing attributes')?.value).toBe('height')
    expect(result.presentation?.evidence[1]?.fields.find((field) => field.key === 'Missing attributes')?.value).toBe('width, height')
    expect(result.presentation?.evidence[0]?.fields.find((field) => field.key === 'src')).toEqual({ key: 'src', value: '/trip.jpg', kind: 'url' })
    expect(result.details).toBeUndefined()
    expect(toResultCopyPayload(result)).toContain('/map.jpg')
    expect(toResultCopyPayload(result)).toContain(rule.meta.references[0])
  })

  it('treats an empty dimension attribute as missing and shows the single image instead of a count of 1', async () => {
    const result = await run('<img src="/a.jpg" width="1" height="2"><img src="/b.jpg" width="" height="2">')
    expect(result.type).toBe('warn')
    expect(value(result, 'Missing dimensions')).toBeUndefined(); expect(value(result, 'Images checked')).toBe(2)
    expect(value(result, '<img>')).toBe('<img src="/b.jpg" width="" height="2">')
  })

  it('passes when every image has non-empty width and height attributes', async () => {
    const result = await run('<img src="/a.jpg" width="1" height="2"><img src="/b.jpg" width="3" height="4">')
    expect(result.type).toBe('ok'); expect(result.priority).toBe(850); expect(value(result, 'Missing dimensions')).toBe(0)
    expect(result.presentation?.evidence).toEqual([])
  })

  it('uses a text field, never a url field, for a source that cannot resolve to http(s)', async () => {
    const result = await run('<img src="javascript:alert(1)"><img>')
    expect(result.presentation?.evidence[0]?.fields.find((field) => field.key === 'src')).toEqual({ key: 'src', value: 'javascript:alert(1)', kind: 'text' })
    expect(result.presentation?.evidence[1]?.fields.find((field) => field.key === 'src')).toEqual({ key: 'src', value: 'Not declared', kind: 'text' })
  })

  it('ships every affected image with truthful counts and summarizes the sources above three', async () => {
    const html = Array.from({ length: 11 }, (_, index) => `<img src="/image-${index + 1}.jpg">`).join('')
    const result = await run(html)
    expect(value(result, 'Sources')).toBe('/image-1.jpg, /image-2.jpg, /image-3.jpg … 8 more')
    expect(detail(result, 'Evidence retained')).toBe(11); expect(detail(result, 'Evidence omitted')).toBe(0)
    expect(detail(result, 'Markup retained')).toBe(11)
    expect(result.presentation?.markup).toHaveLength(11)
  })

  it('bounds the alt excerpt and states unretained markup inside the record', async () => {
    const result = await run(`<img src="/big.jpg" alt="${'x'.repeat(2000)}">`)
    expect(result.presentation?.evidence[0]?.fields[1]).toEqual({ key: 'alt', value: `${'x'.repeat(100)}…`, kind: 'text' })
    expect(result.presentation?.markup).toEqual([])
    expect(result.presentation?.evidence[0]?.fields).toContainEqual({ key: 'Markup', value: 'Not captured', kind: 'text' })
  })
})
