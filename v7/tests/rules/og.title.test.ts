import { describe, expect, it } from 'vitest'

import { enrichResult } from '@/core/runHelpers'
import { ogTitleRule as rule } from '@/rules/og/title'
import { presentationSchema } from '@/shared/presentation/schema'
import { toResultCopyPayload } from '@/components/result/resultCopy'

const D = (h: string) => new DOMParser().parseFromString(h, 'text/html')
const run = async (html: string) => enrichResult(await rule.run({ html, url: 'https://example.test/', doc: D(html) }, { globals: {} }), rule, 'test')
const value = (result: Awaited<ReturnType<typeof run>>, key: string) => result.presentation?.values.find((field) => field.key === key)?.value

describe('Open Graph title rule', () => {
  it('reports a missing title as a warning without invented markup', async () => {
    const result = await run('<title>x</title>')
    expect(result.type).toBe('warn')
    expect(value(result, 'og:title')).toBe('Absent')
    expect(result.presentation?.markup).toEqual([])
    expect(presentationSchema.safeParse(result.presentation).success).toBe(true)
  })

  it('warns for an empty property value and retains its attributes', async () => {
    const html = '<meta property="og:title" data-source="cms" content="">'
    const result = await run(html)
    expect(result.type).toBe('warn')
    expect(value(result, 'og:title')).toBe('Empty')
    expect(result.presentation?.markup[0].value).toBe(html)
  })

  it('reports the first matching property and preserves all references in copy', async () => {
    const html = '<meta property="og:title" data-source="cms" content="T &amp; C"><meta property="og:title" content="Second">'
    const result = await run(html)
    expect(result.type).toBe('info')
    expect(value(result, 'og:title')).toBe('Present')
    expect(value(result, 'Content characters')).toBe(5)
    expect(value(result, 'Title')).toBe('T & C')
    expect(result.presentation?.markup.map((field) => field.value)).toEqual([
      '<meta property="og:title" data-source="cms" content="T &amp; C">', '<meta property="og:title" content="Second">',
    ])
    expect(result.label).toBe('HEAD')
    expect(result.details).toBeUndefined()
    expect(toResultCopyPayload(result)).toContain(rule.meta.references[0])
  })

  it('supports the name attribute selector and reports omitted source elements', async () => {
    const html = Array.from({ length: 11 }, (_, index) => `<meta name="og:title" content="Title ${index + 1}">`).join('')
    const result = await run(html)
    expect(result.type).toBe('info')
    expect(result.presentation?.detailValues.find((field) => field.key === 'Elements omitted')?.value).toBe(1)
    expect(result.presentation?.markup).toHaveLength(10)
  })
})
