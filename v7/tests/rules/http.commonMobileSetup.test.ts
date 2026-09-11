import { describe, expect, it } from 'vitest'

import { commonMobileSetupRule } from '@/rules/http/commonMobileSetup'
import { enrichResult } from '@/core/runHelpers'
import { toResultCopyPayload } from '@/components/result/resultCopy'

const P = (html: string) => ({ html, url: 'https://ex.com/', doc: new DOMParser().parseFromString(html, 'text/html') })
const run = async (html: string) => enrichResult(await commonMobileSetupRule.run(P(html) as never, { globals: {} }), commonMobileSetupRule, 'test')

describe('rule: common mobile setup', () => {
  it('warns when meta viewport is missing entirely', async () => {
    const result = await run('<html><head></head><body></body></html>')
    expect(result.type).toBe('warn')
    expect(result.priority).toBe(200)
    expect(result.label).toBe('HEAD')
    expect(result.presentation?.markup).toHaveLength(0)
    expect(result.presentation?.noMarkup).toBe('No meta viewport element found')
  })

  it('warns citing responsive-design guidance, not mobile-first indexing', async () => {
    const result = await run('<html><head><title>t</title></head></html>')
    expect(result.type).toBe('warn')
    const copy = toResultCopyPayload(result)
    expect(copy).not.toContain('mobile-first indexing')
    expect(copy).toContain('https://web.dev/articles/responsive-web-design-basics')
  })

  it('is ok (info) with viewport present even without apple-touch-icon, preserving complete original markup', async () => {
    const result = await run('<html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head></html>')
    expect(result.type).toBe('info')
    expect(result.priority).toBe(750)
    expect(result.presentation?.values).toContainEqual(expect.objectContaining({ key: 'Apple touch icon', value: 'Missing' }))
    expect(result.presentation?.detailValues).toContainEqual(expect.objectContaining({ key: 'Viewport content', value: 'width=device-width, initial-scale=1' }))
    expect(result.presentation?.markup[0]?.value).toBe('<meta name="viewport" content="width=device-width, initial-scale=1">')
  })

  it('reports apple-touch-icon presence as detail evidence', async () => {
    const result = await run('<html><head><meta name="viewport" content="width=device-width"><link rel="apple-touch-icon" href="/i.png"></head></html>')
    expect(result.type).toBe('info')
    expect(result.presentation?.values).toContainEqual(expect.objectContaining({ key: 'Apple touch icon', value: 'Present' }))
    expect(result.presentation?.evidence).toContainEqual({ name: 'Apple touch icon', fields: [{ key: 'href', value: '/i.png', kind: 'text' }] })
  })

  it('copies the retained markup and references without advice', async () => {
    const result = await run('<html><head><meta name="viewport" content="width=device-width"></head></html>')
    const copy = toResultCopyPayload(result)
    for (const value of ['<meta name="viewport" content="width=device-width">', ...commonMobileSetupRule.meta.references]) expect(copy).toContain(value)
    expect(result.details).toBeUndefined()
  })
})
