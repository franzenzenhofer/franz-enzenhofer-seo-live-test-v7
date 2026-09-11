import { describe, expect, it } from 'vitest'

import { http2AdvertisedRule } from '@/rules/http/http2Advertised'
import { enrichResult } from '@/core/runHelpers'
import { toResultCopyPayload } from '@/components/result/resultCopy'

const P = (headers?: Record<string, string>) => ({ html: '', url: 'https://ex.com', doc: new DOMParser().parseFromString('<p/>', 'text/html'), headers })
const run = async (headers?: Record<string, string>) => enrichResult(await http2AdvertisedRule.run(P(headers) as never, { globals: {} }), http2AdvertisedRule, 'test')

describe('rule: http2 advertised', () => {
  it('reports runtime_error when headers were not captured', async () => {
    const result = await run(undefined)
    expect(result.type).toBe('runtime_error')
    expect(result.priority).toBe(50)
    expect(result.presentation?.input).toBe('Not captured')
  })

  it('detects h2 advertised in Alt-Svc', async () => {
    const result = await run({ 'alt-svc': 'h2=":443"; ma=2592000' })
    expect(result.type).toBe('info')
    expect(result.priority).toBe(750)
    expect(result.presentation?.values).toContainEqual(expect.objectContaining({ key: 'HTTP/2 advertised', value: 'Yes' }))
  })

  it('does not match h2 inside a hostname-like token', async () => {
    const result = await run({ 'alt-svc': 'h2ostname=":443"' })
    expect(result.presentation?.values).toContainEqual(expect.objectContaining({ key: 'HTTP/2 advertised', value: 'No' }))
    expect(result.priority).toBe(850)
  })

  it('reports no advertisement when Alt-Svc is absent', async () => {
    const result = await run({ 'content-type': 'text/html' })
    expect(result.presentation?.values).toContainEqual(expect.objectContaining({ key: 'Alt-Svc header', value: 'Not present' }))
    expect(result.priority).toBe(850)
  })

  it('preserves the original Alt-Svc header value verbatim and references without advice', async () => {
    const result = await run({ 'alt-svc': 'h2=":443"; ma=2592000' })
    const copy = toResultCopyPayload(result)
    for (const value of ['h2=":443"; ma=2592000', ...http2AdvertisedRule.meta.references]) expect(copy).toContain(value)
    expect(result.details).toBeUndefined()
  })
})
