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
    expect(value(result, 'Images checked')).toBe(0); expect(value(result, 'Images missing dimensions')).toBe(0)
    expect(result.presentation?.markup).toEqual([])
    expect(result.details).toBeUndefined()
  })

  it('reports each missing dimension and retains complete source markup', async () => {
    const html = '<img src="/trip.jpg" alt="Trip" width="1200"><img src="/map.jpg" alt="Map">'
    const result = await run(html)
    expect(result.type).toBe('warn'); expect(result.priority).toBe(300)
    expect(value(result, 'Images checked')).toBe(2); expect(value(result, 'Images missing dimensions')).toBe(2)
    expect(result.presentation?.markup.map((field) => field.value)).toEqual([
      '<img src="/trip.jpg" alt="Trip" width="1200">', '<img src="/map.jpg" alt="Map">',
    ])
    expect(result.presentation?.evidence[0]?.fields.find((field) => field.key === 'Missing attributes')?.value).toBe('height')
    expect(result.presentation?.evidence[1]?.fields.find((field) => field.key === 'Missing attributes')?.value).toBe('width, height')
    expect(result.presentation?.evidence[0]?.fields.find((field) => field.key === 'Source URL')).toEqual({ key: 'Source URL', value: '/trip.jpg', kind: 'url' })
    expect(result.details).toBeUndefined()
    expect(toResultCopyPayload(result)).toContain('/map.jpg')
    expect(toResultCopyPayload(result)).toContain(rule.meta.references[0])
  })

  it('treats an empty dimension attribute as missing', async () => {
    const result = await run('<img src="/a.jpg" width="1" height="2"><img src="/b.jpg" width="" height="2">')
    expect(result.type).toBe('warn')
    expect(value(result, 'Images missing dimensions')).toBe(1)
  })

  it('passes when every image has non-empty width and height attributes', async () => {
    const result = await run('<img src="/a.jpg" width="1" height="2"><img src="/b.jpg" width="3" height="4">')
    expect(result.type).toBe('ok'); expect(result.priority).toBe(850); expect(value(result, 'Images missing dimensions')).toBe(0)
  })

  it('uses a text field, never a url field, for a source that cannot resolve to http(s)', async () => {
    const result = await run('<img src="javascript:alert(1)"><img>')
    expect(result.presentation?.evidence[0]?.fields.find((field) => field.key === 'Source URL')).toEqual({ key: 'Source URL', value: 'javascript:alert(1)', kind: 'text' })
    expect(result.presentation?.evidence[1]?.fields.find((field) => field.key === 'Source URL')).toEqual({ key: 'Source URL', value: 'Not declared', kind: 'text' })
  })

  it('bounds affected image evidence and reports omitted records', async () => {
    const html = Array.from({ length: 11 }, (_, index) => `<img src="/image-${index + 1}.jpg">`).join('')
    const result = await run(html)
    expect(detail(result, 'Affected examples retained')).toBe(10)
    expect(detail(result, 'Affected examples omitted')).toBe(1)
    expect(result.presentation?.markup).toHaveLength(10)
  })

  it('labels the bounded alt excerpt and states unretained markup', async () => {
    const result = await run(`<img src="/big.jpg" alt="${'x'.repeat(2000)}">`)
    expect(result.presentation?.evidence[0]?.fields[0]).toEqual({ key: 'Alt text (first 100 characters)', value: `${'x'.repeat(100)}…`, kind: 'text' })
    expect(result.presentation?.markup).toEqual([])
    expect(result.presentation?.evidence.find((record) => record.name === 'Capture status')?.fields).toEqual([{ key: 'Image markup 1', value: 'Complete original markup not retained', kind: 'text' }])
  })
})
