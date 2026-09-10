import { describe, expect, it } from 'vitest'

import { enrichResult } from '@/core/runHelpers'
import { ogDescriptionRule as rule } from '@/rules/og/description'
import { presentationSchema } from '@/shared/presentation/schema'
import { toResultCopyPayload } from '@/components/result/resultCopy'

const doc = (h: string) => new DOMParser().parseFromString(h, 'text/html')
const run = async (html: string) => enrichResult(await rule.run({ html, url: 'https://example.test/', doc: doc(html) }, { globals: {} }), rule, 'test')
const value = (result: Awaited<ReturnType<typeof run>>, key: string) => result.presentation?.values.find((field) => field.key === key)?.value

describe('Open Graph description rule', () => {
  it('reports a missing description as informational', async () => {
    const result = await run('<title>x</title>')
    expect(result.type).toBe('info')
    expect(value(result, 'og:description')).toBe('Absent')
    expect(result.presentation?.markup).toEqual([])
    expect(presentationSchema.safeParse(result.presentation).success).toBe(true)
  })

  it('warns when the first matching description is empty and preserves its markup', async () => {
    const html = '<meta property="og:description" data-source="cms" content="">'
    const result = await run(html)
    expect(result.type).toBe('warn')
    expect(value(result, 'og:description')).toBe('Empty')
    expect(result.presentation?.markup[0].value).toBe(html)
  })

  it('reports a present description, its extracted length, and all bounded source markup', async () => {
    const html = '<meta name="og:description" content="A &amp; B"><meta name="og:description" content="Second">'
    const result = await run(html)
    expect(result.type).toBe('info')
    expect(value(result, 'og:description')).toBe('Present')
    expect(value(result, 'Content characters')).toBe(5)
    expect(value(result, 'Description (trimmed)')).toBe('A & B')
    expect(result.presentation?.markup.map((field) => field.value)).toEqual([
      '<meta name="og:description" content="A &amp; B">', '<meta name="og:description" content="Second">',
    ])
    expect(result.label).toBe('HEAD')
    expect(result.details).toBeUndefined()
    expect(toResultCopyPayload(result)).toContain(rule.meta.references[0])
  })

  it('retains only the bounded sample and reports omitted matching elements', async () => {
    const html = Array.from({ length: 11 }, (_, index) => `<meta property="og:description" content="Description ${index + 1}">`).join('')
    const result = await run(html)
    expect(result.presentation?.detailValues.find((field) => field.key === 'Elements omitted')?.value).toBe(1)
    expect(result.presentation?.markup).toHaveLength(10)
  })
})
