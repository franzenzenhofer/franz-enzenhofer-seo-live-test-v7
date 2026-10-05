import { describe, expect, it } from 'vitest'

import { enrichResult } from '@/core/runHelpers'
import { dataNosnippetRule as rule } from '@/rules/dom/dataNosnippet'
import { presentationSchema } from '@/shared/presentation/schema'
import { toResultCopyPayload } from '@/components/result/resultCopy'

const D = (h: string) => new DOMParser().parseFromString(h, 'text/html')
const run = async (html: string) => enrichResult(await rule.run({ html, url: 'https://example.test/', doc: D(html) }, { globals: {} }), rule, 'test')
const value = (result: Awaited<ReturnType<typeof run>>, key: string) => result.presentation?.values.find((field) => field.key === key)?.value
const detail = (result: Awaited<ReturnType<typeof run>>, key: string) => result.presentation?.detailValues.find((field) => field.key === key)?.value

describe('data-nosnippet usage rule', () => {
  it('reports absent attributes as informational with the highest priority', async () => {
    const result = await run('<body><p>Visible text</p></body>')
    expect(result.type).toBe('info'); expect(result.priority).toBe(910)
    expect(result.presentation?.values).toEqual([{ key: 'data-nosnippet', value: 'Not found', kind: 'text' }])
    expect(result.presentation?.markup).toEqual([])
    expect(result.presentation?.input).toBe('Idle DOM')
    expect(presentationSchema.safeParse(result.presentation).success).toBe(true)
  })

  it('reports supported elements with their complete source markup', async () => {
    const html = '<span data-nosnippet="">Hidden</span><div data-nosnippet="token">Hidden <em>too</em></div><section data-nosnippet>Also</section>'
    const result = await run(html)
    expect(result.type).toBe('info'); expect(result.priority).toBe(700)
    expect(value(result, 'Elements')).toBe(3); expect(value(result, 'Tags')).toBe('span, div, section')
    expect(result.presentation?.markup).toEqual([
      { key: '<span data-nosnippet>', value: '<span data-nosnippet="">Hidden</span>', kind: 'original', fidelity: 'complete-original' },
      { key: '<div data-nosnippet>', value: '<div data-nosnippet="token">Hidden <em>too</em></div>', kind: 'original', fidelity: 'complete-original' },
      { key: '<section data-nosnippet>', value: '<section data-nosnippet="">Also</section>', kind: 'original', fidelity: 'complete-original' },
    ])
    // Three elements fit the overview: every original field follows the plain rows.
    expect(result.presentation?.values.filter((field) => field.kind === 'original')).toHaveLength(3)
    expect(result.presentation?.evidence[1]).toEqual({ name: '<div data-nosnippet>', fields: [
      { key: 'Text', value: 'Hidden too', kind: 'text' }, { key: 'Attribute value', value: 'token', kind: 'text' },
      { key: 'Tag support', value: 'Supported', kind: 'text' }, expect.objectContaining({ key: 'DOM path', kind: 'path' }),
    ] })
    expect(detail(result, 'Markup retained')).toBe(3); expect(detail(result, 'Evidence retained')).toBe(3)
    expect(result.details).toBeUndefined(); expect(toResultCopyPayload(result)).toContain(rule.meta.references[0])
  })

  it('warns for unsupported tags and reports their observed tag names', async () => {
    const html = '<p data-nosnippet>Hidden text</p><span data-nosnippet>Fine</span>'
    const result = await run(html)
    expect(result.type).toBe('warn'); expect(result.priority).toBe(300)
    expect(value(result, 'Elements')).toBe(2); expect(value(result, 'Unsupported tags')).toBe('p')
    expect(value(result, 'Tags')).toBeUndefined()
    // Every found element is shown, the unsupported one first.
    expect(result.presentation?.markup.map((field) => field.key)).toEqual(['<p data-nosnippet>', '<span data-nosnippet>'])
    expect(result.presentation?.evidence[0]?.fields).toContainEqual({ key: 'Tag support', value: 'Unsupported', kind: 'text' })
  })

  it('bounds unsupported element evidence and reports omitted records', async () => {
    const html = Array.from({ length: 11 }, (_, index) => `<p data-nosnippet>P${index + 1}</p>`).join('')
    const result = await run(html)
    expect(detail(result, 'Markup retained')).toBe(10); expect(detail(result, 'Markup omitted')).toBe(1)
    expect(detail(result, 'Evidence retained')).toBe(10); expect(detail(result, 'Evidence omitted')).toBe(1)
    expect(result.presentation?.markup).toHaveLength(10)
    expect(result.presentation?.values.some((field) => field.kind === 'original')).toBe(false)
  })
})
