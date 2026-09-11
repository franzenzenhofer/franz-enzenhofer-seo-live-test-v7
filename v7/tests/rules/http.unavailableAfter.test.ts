import { describe, expect, it } from 'vitest'

import { unavailableAfterRule } from '@/rules/http/unavailableAfter'
import { enrichResult } from '@/core/runHelpers'
import { toResultCopyPayload } from '@/components/result/resultCopy'

const P = (headers?: Record<string, string>) => ({ html: '', url: 'https://ex.com', doc: new DOMParser().parseFromString('<p/>', 'text/html'), headers })
const run = async (headers?: Record<string, string>) => enrichResult(await unavailableAfterRule.run(P(headers) as never, { globals: {} }), unavailableAfterRule, 'test')

describe('rule: http unavailable_after', () => {
  it('reports runtime_error when headers not captured', async () => {
    const result = await run(undefined)
    expect(result.type).toBe('runtime_error')
    expect(result.priority).toBe(50)
  })

  it('reports missing header as info', async () => {
    const result = await run({ 'content-type': 'text/html' })
    expect(result.type).toBe('info')
    expect(result.priority).toBe(900)
  })

  it('ok when header has no unavailable_after directive', async () => {
    const result = await run({ 'x-robots-tag': 'noindex, nofollow' })
    expect(result.type).toBe('ok')
    expect(result.priority).toBe(850)
  })

  it('captures the full RFC 822 date, not just the first token', async () => {
    const result = await run({ 'x-robots-tag': 'unavailable_after: 25 Jun 2049 15:00:00 GMT' })
    expect(result.type).toBe('warn')
    expect(result.priority).toBe(150)
    expect(result.presentation?.values).toContainEqual(expect.objectContaining({ key: 'unavailable_after date', value: '25 Jun 2049 15:00:00 GMT' }))
  })

  it('errors when the removal date is already in the past', async () => {
    const result = await run({ 'x-robots-tag': 'unavailable_after: 25 Jun 2010 15:00:00 GMT' })
    expect(result.type).toBe('error')
    expect(result.priority).toBe(80)
  })

  it('detects the directive after other rules in the header', async () => {
    const result = await run({ 'x-robots-tag': 'noindex, unavailable_after: 25 Jun 2010 15:00:00 GMT' })
    expect(result.type).toBe('error')
  })

  it('warns without asserting removal when the date is unparseable, keeping the Google-ignores caveat in checked', async () => {
    const result = await run({ 'x-robots-tag': 'unavailable_after: not-a-date' })
    expect(result.type).toBe('warn')
    expect(result.priority).toBe(300)
    expect(result.presentation?.values).toContainEqual(expect.objectContaining({ key: 'Status', value: 'Directive date is not parseable' }))
    expect(result.presentation?.checked).toContainEqual(expect.objectContaining({ key: 'Criterion', value: expect.stringContaining('Google ignores the directive') }))
  })

  it('preserves the original X-Robots-Tag header value verbatim and references without advice', async () => {
    const result = await run({ 'x-robots-tag': 'unavailable_after: 25 Jun 2010 15:00:00 GMT' })
    const copy = toResultCopyPayload(result)
    for (const value of ['unavailable_after: 25 Jun 2010 15:00:00 GMT', ...unavailableAfterRule.meta.references]) expect(copy).toContain(value)
    expect(result.details).toBeUndefined()
  })
})
