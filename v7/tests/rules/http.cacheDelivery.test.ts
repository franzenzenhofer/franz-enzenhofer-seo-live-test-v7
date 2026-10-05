import { describe, expect, it } from 'vitest'

import { cacheDeliveryRule } from '@/rules/http/cacheDelivery'
import { enrichResult } from '@/core/runHelpers'
import { toResultCopyPayload } from '@/components/result/resultCopy'

const P = (headers?: Record<string, string>) => ({ html: '', url: 'https://ex.com', doc: new DOMParser().parseFromString('<p/>', 'text/html'), headers })
const run = async (headers?: Record<string, string>) => enrichResult(await cacheDeliveryRule.run(P(headers) as never, { globals: {} }), cacheDeliveryRule, 'test')

describe('rule: cache delivery (Age header)', () => {
  it('returns runtime_error when headers not captured', async () => {
    const result = await run(undefined)
    expect(result.type).toBe('runtime_error')
    expect(result.priority).toBe(50)
  })

  it('does not claim cache delivery when Age header is absent (RFC 9111 5.1)', async () => {
    const result = await run({ 'content-type': 'text/html' })
    expect(result.type).toBe('info')
    expect(result.priority).toBe(900)
    expect(result.presentation?.values).toEqual([{ key: 'Age', value: 'Absent', kind: 'text' }])
  })

  it('treats Age: 0 as cache-mediated, not fresh from origin (RFC 9111 5.1)', async () => {
    const result = await run({ 'content-type': 'text/html', age: '0' })
    expect(result.type).toBe('info')
    expect(result.priority).toBe(750)
    expect(result.presentation?.values).toEqual([{ key: 'Age', value: '0', kind: 'text' }, { key: 'Cache age', value: '0 seconds', kind: 'text' }])
  })

  it('reports seconds for small ages', async () => {
    const result = await run({ age: '42' })
    expect(result.presentation?.values).toContainEqual(expect.objectContaining({ key: 'Cache age', value: '42 seconds' }))
  })

  it('reports minutes and hours for larger ages', async () => {
    const minutes = await run({ age: '600' })
    expect(minutes.presentation?.values).toContainEqual(expect.objectContaining({ key: 'Cache age', value: '10 minutes' }))
    const hours = await run({ age: '7200' })
    expect(hours.presentation?.values).toContainEqual(expect.objectContaining({ key: 'Cache age', value: '2 hours' }))
  })

  it.each(['NaN', '-1', '1.5'])('identifies malformed Age %s instead of displaying a made-up duration', async (age) => {
    const result = await run({ Age: age })
    expect(result.type).toBe('warn')
    expect(result.priority).toBe(900)
    expect(result.presentation?.values).toContainEqual(expect.objectContaining({ key: 'Cache age', value: 'Invalid value' }))
  })

  it('preserves the original Age header value verbatim and references without advice', async () => {
    const result = await run({ age: '42' })
    const copy = toResultCopyPayload(result)
    for (const value of ['Age: 42', ...cacheDeliveryRule.meta.references]) expect(copy).toContain(value)
    expect(result.details).toBeUndefined()
  })
})
