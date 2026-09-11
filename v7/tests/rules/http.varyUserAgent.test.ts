import { describe, it, expect } from 'vitest'

import { varyUserAgentRule } from '@/rules/http/varyUserAgent'
import { enrichResult } from '@/core/runHelpers'
import { toResultCopyPayload } from '@/components/result/resultCopy'

const P = (h: Record<string, string>) => ({ html: '', url: '', doc: new DOMParser().parseFromString('<p/>', 'text/html'), headers: h })

describe('rule: vary user-agent', () => {
  it('returns runtime_error when headers not captured', async () => {
    const r = await varyUserAgentRule.run(P({}), { globals: {} })
    expect(r.type).toBe('runtime_error')
    expect(r.priority).toBe(50)
    expect(r.presentation?.input).toBe('Not captured')
  })

  it('reports absence', async () => {
    const r = await varyUserAgentRule.run(P({ 'content-type': 'text/html' }), { globals: {} })
    expect(r.type).toBe('info')
    expect(r.priority).toBe(850)
    expect(r.presentation?.values).toContainEqual({ key: 'Vary', value: 'Not present', kind: 'text' })
    expect(r.presentation?.values).toContainEqual({ key: 'Includes User-Agent', value: 'No', kind: 'text' })
  })

  it('reports vary present without User-Agent', async () => {
    const r = await varyUserAgentRule.run(P({ vary: 'Accept-Encoding' }), { globals: {} })
    expect(r.priority).toBe(850)
    expect(r.presentation?.values).toContainEqual({ key: 'Vary', value: 'Accept-Encoding', kind: 'text' })
    expect(r.presentation?.values).toContainEqual({ key: 'Includes User-Agent', value: 'No', kind: 'text' })
  })

  it('reports vary UA', async () => {
    const r = await varyUserAgentRule.run(P({ vary: 'Accept-Encoding, User-Agent' }), { globals: {} })
    expect(r.priority).toBe(750)
    expect(r.presentation?.values).toContainEqual({ key: 'Includes User-Agent', value: 'Yes', kind: 'text' })
  })

  it('copies references and labelled facts without legacy details', async () => {
    const result = enrichResult(await varyUserAgentRule.run(P({ vary: 'User-Agent' }), { globals: {} }), varyUserAgentRule, 'test')
    const copy = toResultCopyPayload(result)
    for (const value of ['User-Agent', ...varyUserAgentRule.meta.references]) expect(copy).toContain(value)
    expect(result.details).toBeUndefined()
  })
})
