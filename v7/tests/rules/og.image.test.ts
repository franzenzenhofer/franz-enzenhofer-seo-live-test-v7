import { describe, expect, it } from 'vitest'

import { enrichResult } from '@/core/runHelpers'
import { ogImageRule as rule } from '@/rules/og/image'
import { toResultCopyPayload } from '@/components/result/resultCopy'

const doc = (h: string) => new DOMParser().parseFromString(h, 'text/html')
const run = async (html: string) => enrichResult(await rule.run({ html, url: 'https://example.test/', doc: doc(html) }, { globals: {} }), rule, 'test')
const value = (result: Awaited<ReturnType<typeof run>>, key: string) => result.presentation?.values.find((field) => field.key === key)?.value
const detail = (result: Awaited<ReturnType<typeof run>>, key: string) => result.presentation?.detailValues.find((field) => field.key === key)?.value

describe('Open Graph image rule', () => {
  it('warns when the image declaration is absent', async () => {
    const result = await run('<title>x</title>')
    expect(result.type).toBe('warn'); expect(result.priority).toBe(500); expect(value(result, 'og:image')).toBe('Not found')
    expect(result.presentation?.markup).toEqual([])
    expect(result.label).toBe('HEAD')
  })

  it('warns for an empty or relative image URL and preserves source markup', async () => {
    const empty = await run('<meta property="og:image" data-source="cms" content="">')
    expect(empty.type).toBe('warn'); expect(empty.priority).toBe(350); expect(value(empty, 'og:image')).toBe('Empty')
    const relative = await run('<meta property="og:image" content="/a.jpg">')
    expect(relative.type).toBe('warn'); expect(relative.priority).toBe(350)
    expect(relative.presentation?.values).toEqual([{ key: 'og:image', value: '/a.jpg', kind: 'text' }, { key: 'URL form', value: 'Relative', kind: 'text' },
      { key: '<meta property="og:image">', value: '<meta property="og:image" content="/a.jpg">', kind: 'original', fidelity: 'complete-original' }])
    expect(relative.presentation?.markup[0].value).toBe('<meta property="og:image" content="/a.jpg">')
  })

  it('reports an absolute image URL as informational and preserves the reference in copy', async () => {
    const html = '<meta name="og:image" data-source="cms" content="https://example.test/photo.jpg">'
    const result = await run(html)
    expect(result.type).toBe('info'); expect(result.priority).toBe(760)
    expect(result.presentation?.values[0]).toEqual({ key: 'og:image', value: 'https://example.test/photo.jpg', kind: 'url' })
    expect(result.presentation?.values[1]).toMatchObject({ key: '<meta name="og:image">', kind: 'original', value: html })
    expect(result.details).toBeUndefined(); expect(toResultCopyPayload(result)).toContain(rule.meta.references[0])
  })

  it('retains only a bounded sample of duplicate image declarations', async () => {
    const html = Array.from({ length: 11 }, (_, index) => `<meta property="og:image" content="https://example.test/${index + 1}.jpg">`).join('')
    const result = await run(html)
    expect(detail(result, 'Markup omitted')).toBe(1); expect(detail(result, 'Evidence retained')).toBe(10)
    expect(result.presentation?.markup).toHaveLength(10)
  })
})
