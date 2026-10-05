import { describe, expect, it } from 'vitest'

import { negotiatedProtocolRule } from '@/rules/http/negotiatedProtocol'
import { enrichResult } from '@/core/runHelpers'
import { toResultCopyPayload } from '@/components/result/resultCopy'

const P = (proto?: string, url = 'https://ex.com') =>
  ({ html: '', url, doc: new DOMParser().parseFromString('<p/>', 'text/html'), navigationTiming: { nextHopProtocol: proto || '' } })
const run = async (proto?: string, url?: string) => enrichResult(await negotiatedProtocolRule.run(P(proto, url) as never, { globals: {} }), negotiatedProtocolRule, 'test')

describe('rule: negotiated protocol', () => {
  it('reads the protocol from navigation timing, not from response headers', async () => {
    const result = await run('h2')
    expect(result.type).toBe('ok')
    expect(result.presentation?.input).toBe('Navigation events + Page URL')
    expect(result.presentation?.values).toContainEqual(expect.objectContaining({ key: 'Negotiated protocol', value: 'h2' }))
  })

  it('says the protocol was not captured when navigation timing has none', async () => {
    const result = await run('')
    expect(result.type).toBe('info')
    expect(result.presentation?.input).toBe('Not captured')
    expect(result.presentation?.values).toContainEqual(expect.objectContaining({ key: 'Negotiated protocol', value: 'Not captured' }))
  })

  it('errors when HTTPS negotiates http/1.1 (outdated) with the criterion stated in checked, not values', async () => {
    const result = await run('http/1.1')
    expect(result.type).toBe('error')
    expect(result.priority).toBe(200)
    expect(result.presentation?.values).toContainEqual(expect.objectContaining({ key: 'Negotiated protocol', value: 'http/1.1' }))
    expect(result.presentation?.detailValues).toEqual([{ key: 'Scheme', value: 'https:', kind: 'text' }])
    expect(result.presentation?.checked).toContainEqual(expect.objectContaining({ key: 'Criterion', value: expect.stringContaining('HTTP/1.x') }))
  })

  it('does not error http/1.1 over plain HTTP', async () => {
    const result = await run('http/1.1', 'http://ex.com')
    expect(result.type).toBe('info')
    expect(result.presentation?.detailValues).toEqual([{ key: 'Scheme', value: 'http:', kind: 'text' }])
  })

  it('treats h2 as a passing state', async () => {
    const result = await run('h2')
    expect(result.type).toBe('ok')
    expect(result.priority).toBe(780)
  })

  it('reports ok for h3', async () => {
    const result = await run('h3')
    expect(result.type).toBe('ok')
    expect(result.priority).toBe(800)
  })

  it('copies the negotiated protocol and references without advice', async () => {
    const result = await run('h3')
    const copy = toResultCopyPayload(result)
    for (const value of ['Negotiated protocol: h3', ...negotiatedProtocolRule.meta.references]) expect(copy).toContain(value)
    expect(result.details).toBeUndefined()
  })
})
