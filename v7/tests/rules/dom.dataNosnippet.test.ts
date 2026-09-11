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
    expect(result.type).toBe('info'); expect(result.priority).toBe(910); expect(value(result, 'data-nosnippet elements')).toBe(0)
    expect(result.presentation?.markup).toEqual([])
    expect(result.presentation?.input).toBe('Idle DOM')
    expect(presentationSchema.safeParse(result.presentation).success).toBe(true)
  })

  it('reports supported elements with their complete source markup', async () => {
    const html = '<span data-nosnippet="">Hidden</span><div data-nosnippet="token">Hidden <em>too</em></div><section data-nosnippet>Also</section>'
    const result = await run(html)
    expect(result.type).toBe('info'); expect(result.priority).toBe(700); expect(value(result, 'data-nosnippet elements')).toBe(3)
    expect(result.presentation?.markup.map((field) => field.value)).toEqual([
      '<span data-nosnippet="">Hidden</span>', '<div data-nosnippet="token">Hidden <em>too</em></div>', '<section data-nosnippet="">Also</section>',
    ])
    expect(result.presentation?.evidence[1]?.fields.find((field) => field.key === 'Element text (first 100 characters)')?.value).toBe('Hidden too')
    expect(result.details).toBeUndefined(); expect(toResultCopyPayload(result)).toContain(rule.meta.references[0])
  })

  it('warns for unsupported tags and reports their observed tag names', async () => {
    const html = '<p data-nosnippet>Hidden text</p><span data-nosnippet>Fine</span>'
    const result = await run(html)
    expect(result.type).toBe('warn'); expect(result.priority).toBe(300)
    expect(value(result, 'data-nosnippet elements')).toBe(2); expect(value(result, 'Unsupported elements')).toBe(1)
    expect(value(result, 'Unsupported tags')).toBe('p'); expect(result.presentation?.markup).toHaveLength(1)
  })

  it('bounds unsupported element evidence and reports omitted records', async () => {
    const html = Array.from({ length: 11 }, (_, index) => `<p data-nosnippet>P${index + 1}</p>`).join('')
    const result = await run(html)
    expect(detail(result, 'Examples retained')).toBe(10); expect(detail(result, 'Examples omitted')).toBe(1)
    expect(result.presentation?.markup).toHaveLength(10)
  })
})
