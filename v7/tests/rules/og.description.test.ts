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
    expect(value(result, 'og:description')).toBe('Not found')
    expect(result.presentation?.markup).toEqual([])
    expect(presentationSchema.safeParse(result.presentation).success).toBe(true)
  })

  it('warns when the first matching description is empty and preserves its markup', async () => {
    const html = '<meta property="og:description" data-source="cms" content="">'
    const result = await run(html)
    expect(result.type).toBe('warn')
    expect(value(result, 'og:description')).toBe('Empty')
    expect(result.presentation?.markup[0].value).toBe(html)
    expect(result.presentation?.values[1]).toMatchObject({ key: '<meta property="og:description">', kind: 'original', value: html })
  })

  it('reports a present description, its measured length, and all source markup in the overview', async () => {
    const html = '<meta name="og:description" content="A &amp; B"><meta name="og:description" content="Second">'
    const result = await run(html)
    expect(result.type).toBe('info')
    expect(value(result, 'Characters')).toBe(5)
    expect(value(result, 'Description')).toBeUndefined()
    expect(result.presentation?.evidence[0]?.fields[0]).toEqual({ key: 'content', value: 'A & B', kind: 'text' })
    expect(result.presentation?.values.filter((field) => field.kind === 'original').map((field) => field.value)).toEqual([
      '<meta name="og:description" content="A &amp; B">', '<meta name="og:description" content="Second">',
    ])
    expect(result.presentation?.markup.map((field) => field.value)).toEqual([
      '<meta name="og:description" content="A &amp; B">', '<meta name="og:description" content="Second">',
    ])
    expect(result.label).toBe('HEAD')
    expect(result.details).toBeUndefined()
    expect(toResultCopyPayload(result)).toContain(rule.meta.references[0])
  })

  it('retains only the bounded sample, shows the text instead of eleven markup fields, and reports omitted elements', async () => {
    const html = Array.from({ length: 11 }, (_, index) => `<meta property="og:description" content="Description ${index + 1}">`).join('')
    const result = await run(html)
    expect(value(result, 'Description')).toBe('Description 1')
    expect(result.presentation?.detailValues.find((field) => field.key === 'Markup omitted')?.value).toBe(1)
    expect(result.presentation?.markup).toHaveLength(10)
  })
})
