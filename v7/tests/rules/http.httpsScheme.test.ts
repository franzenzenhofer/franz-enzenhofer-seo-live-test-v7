import { describe, expect, it } from 'vitest'

import { httpsSchemeRule } from '@/rules/http/httpsScheme'
import { enrichResult } from '@/core/runHelpers'
import { toResultCopyPayload } from '@/components/result/resultCopy'

const P = (url: string) => ({ html: '', url, doc: new DOMParser().parseFromString('<p/>', 'text/html') })
const run = async (url: string) => enrichResult(await httpsSchemeRule.run(P(url) as never, { globals: {} }), httpsSchemeRule, 'test')

describe('rule: https scheme', () => {
  it('passes for https', async () => {
    const result = await run('https://ex.com/page')
    expect(result.type).toBe('ok')
    expect(result.priority).toBe(800)
    expect(result.presentation?.input).toBe('Page URL')
    expect(result.presentation?.values).toContainEqual(expect.objectContaining({ key: 'HTTPS in use', value: 'Yes' }))
    expect(result.presentation?.detailValues).toContainEqual({ key: 'Page URL', value: 'https://ex.com/page', kind: 'url' })
  })

  it('warns for http', async () => {
    const result = await run('http://ex.com/page')
    expect(result.type).toBe('warn')
    expect(result.priority).toBe(100)
    expect(result.presentation?.values).toContainEqual(expect.objectContaining({ key: 'Scheme', value: 'http:' }))
  })

  it('warns for an unparseable URL instead of throwing, and does not link it as a URL', async () => {
    const result = await run('not a url')
    expect(result.type).toBe('warn')
    expect(result.presentation?.values).toContainEqual(expect.objectContaining({ key: 'Scheme', value: 'invalid-url' }))
    expect(result.presentation?.detailValues).toContainEqual({ key: 'Page URL', value: 'not a url', kind: 'text' })
  })

  it('checks only the page URL, never document markup', async () => {
    const result = await run('https://ex.com/')
    expect(result.presentation?.markup).toHaveLength(0)
    expect(result.presentation?.noMarkup).toContain('page URL protocol')
  })

  it('copies the page URL, status and references without advice', async () => {
    const result = await run('http://ex.com/insecure')
    const copy = toResultCopyPayload(result)
    for (const value of ['http://ex.com/insecure', 'HTTPS in use: No', ...httpsSchemeRule.meta.references]) expect(copy).toContain(value)
    expect(result.details).toBeUndefined()
  })
})
