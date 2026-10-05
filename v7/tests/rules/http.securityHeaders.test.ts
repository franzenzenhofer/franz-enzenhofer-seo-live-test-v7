import { describe, expect, it } from 'vitest'

import { securityHeadersRule } from '@/rules/http/securityHeaders'
import { enrichResult } from '@/core/runHelpers'
import { toResultCopyPayload } from '@/components/result/resultCopy'

const ALL: Record<string, string> = {
  'content-security-policy': "default-src 'self'",
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',
  'permissions-policy': 'geolocation=()',
  'cross-origin-resource-policy': 'same-origin',
}
const P = (headers?: Record<string, string>) => ({ html: '', url: 'https://ex.com', doc: new DOMParser().parseFromString('<p/>', 'text/html'), headers })
const run = async (headers?: Record<string, string>) => enrichResult(await securityHeadersRule.run(P(headers) as never, { globals: {} }), securityHeadersRule, 'test')

describe('rule: security headers', () => {
  it('returns runtime_error when headers not captured', async () => {
    const result = await run(undefined)
    expect(result.type).toBe('runtime_error')
    expect(result.priority).toBe(50)
  })

  it('warns (info) when headers are missing', async () => {
    const result = await run({ 'content-type': 'text/html' })
    expect(result.type).toBe('info')
    expect(result.priority).toBe(800)
    expect(result.presentation?.values).toContainEqual(expect.objectContaining({ key: 'Headers present', value: '0 of 5' }))
    expect(result.presentation?.values).toContainEqual(expect.objectContaining({ key: 'Absent headers', value: 'content-security-policy, x-content-type-options … 3 more' }))
  })

  it('passes (ok) when all recommended headers are present', async () => {
    const result = await run(ALL)
    expect(result.type).toBe('ok')
    expect(result.priority).toBe(750)
    expect(result.presentation?.values).toContainEqual(expect.objectContaining({ key: 'Headers present', value: '5 of 5' }))
    expect(result.presentation?.values).toContainEqual(expect.objectContaining({ key: 'Absent headers', value: 'None' }))
    expect(result.presentation?.evidence.map((record) => record.name)).toEqual(Object.keys(ALL))
  })

  it('preserves original header values verbatim in evidence and references without advice', async () => {
    const result = await run(ALL)
    const copy = toResultCopyPayload(result)
    for (const value of ["default-src 'self'", 'nosniff', ...securityHeadersRule.meta.references]) expect(copy).toContain(value)
    expect(result.details).toBeUndefined()
  })
})
