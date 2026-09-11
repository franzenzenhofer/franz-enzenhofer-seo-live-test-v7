import { describe, expect, it } from 'vitest'

import { altSvcOtherProtocolsRule } from '@/rules/http/altSvcOtherProtocols'
import { enrichResult } from '@/core/runHelpers'
import { toResultCopyPayload } from '@/components/result/resultCopy'

const P = (headers?: Record<string, string>) => ({ html: '', url: 'https://ex.com', doc: new DOMParser().parseFromString('<p/>', 'text/html'), headers })
const run = async (headers?: Record<string, string>) => enrichResult(await altSvcOtherProtocolsRule.run(P(headers) as never, { globals: {} }), altSvcOtherProtocolsRule, 'test')

describe('rule: alt-svc other protocols', () => {
  it('reports runtime_error when headers were not captured', async () => {
    const result = await run(undefined)
    expect(result.type).toBe('runtime_error')
    expect(result.priority).toBe(50)
  })

  it('reports no header found', async () => {
    const result = await run({ 'content-type': 'text/html' })
    expect(result.priority).toBe(900)
    expect(result.presentation?.values).toContainEqual(expect.objectContaining({ key: 'Alt-Svc header', value: 'Not present' }))
  })

  it('reports quic as an other protocol', async () => {
    const result = await run({ 'alt-svc': 'quic=":443"; ma=2592000; v="43"' })
    expect(result.priority).toBe(700)
    expect(result.presentation?.values).toContainEqual(expect.objectContaining({ key: 'Other (non-standard) protocols', value: 'quic' }))
  })

  it('reports RFC 7838 clear semantics with its own priority', async () => {
    const result = await run({ 'alt-svc': 'clear' })
    expect(result.priority).toBe(820)
    expect(result.presentation?.detailValues).toContainEqual(expect.objectContaining({ key: 'Alt-Svc: clear observed', value: 'Yes' }))
  })

  it('does not treat uppercase CLEAR as the case-sensitive clear value', async () => {
    const result = await run({ 'alt-svc': 'CLEAR' })
    expect(result.priority).toBe(850)
    expect(result.presentation?.detailValues).toContainEqual(expect.objectContaining({ key: 'Alt-Svc: clear observed', value: 'No' }))
  })

  it('reports only standard protocols distinctly from mixed lists', async () => {
    const result = await run({ 'alt-svc': 'h2=":443"; ma=2592000' })
    expect(result.priority).toBe(750)
    expect(result.presentation?.values).toContainEqual(expect.objectContaining({ key: 'Other (non-standard) protocols', value: 'None' }))
  })

  it('preserves the original Alt-Svc header value verbatim and references without advice', async () => {
    const result = await run({ 'alt-svc': 'quic=":443"; ma=2592000; v="43"' })
    const copy = toResultCopyPayload(result)
    for (const value of ['quic=":443"; ma=2592000; v="43"', ...altSvcOtherProtocolsRule.meta.references]) expect(copy).toContain(value)
    expect(result.details).toBeUndefined()
  })

  it('keeps the parse criterion in checked, not restated as a detail value', async () => {
    const result = await run({ 'alt-svc': 'h2=":443"; ma=2592000' })
    expect(result.presentation?.detailValues.map((field) => field.key)).not.toContain('Parse summary')
    expect(result.presentation?.checked).toContainEqual(expect.objectContaining({ key: 'Criterion' }))
  })
})
