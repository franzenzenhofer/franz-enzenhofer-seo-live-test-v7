import { describe, it, expect } from 'vitest'

import { headersPresentRule } from '@/rules/http/headersPresent'
import { enrichResult } from '@/core/runHelpers'
import { toResultCopyPayload } from '@/components/result/resultCopy'

const P = (headers?: Record<string, string>, extra: Record<string, unknown> = {}) =>
  ({ html: '', url: 'https://ex.com', doc: new DOMParser().parseFromString('<p/>', 'text/html'), headers, ...extra })

describe('rule: headers present', () => {
  it('warns when headers missing', async () => {
    const r = await headersPresentRule.run(P({}), { globals: {} })
    expect(r.type).toBe('warn')
    expect(r.priority).toBe(350)
    expect(r.presentation?.input).toBe('Not captured')
    expect(r.presentation?.values).toEqual([{ key: 'Response headers', value: 'Not captured', kind: 'text' }])
  })

  it('reports info when headers exist', async () => {
    const r = await headersPresentRule.run(P({ Status: '200' }), { globals: {} })
    expect(r.type).toBe('info')
    expect(r.priority).toBe(900)
    expect(r.presentation?.values).toContainEqual({ key: 'Headers captured', value: 1, kind: 'text' })
  })

  it('reports the observed status and cache state', async () => {
    const r = await headersPresentRule.run(P({ 'content-type': 'text/html' }, { status: 200, fromCache: true }), { globals: {} })
    expect(r.presentation?.values).toContainEqual({ key: 'Main-document status', value: 'HTTP 200 OK', kind: 'text' })
    expect(r.presentation?.values).toContainEqual({ key: 'Served from', value: 'Browser cache', kind: 'text' })
  })

  it('shows no cache row when the capture carries no cache flag', async () => {
    const r = await headersPresentRule.run(P({ 'content-type': 'text/html' }, { status: 200, fromCache: false }), { globals: {} })
    expect(r.presentation?.values).toContainEqual({ key: 'Served from', value: 'Network', kind: 'text' })
    const unknown = await headersPresentRule.run(P({ 'content-type': 'text/html' }), { globals: {} })
    expect(unknown.presentation?.values.map((field) => field.key)).toEqual(['Headers captured'])
  })

  it('copies references (fallback) and labelled facts without legacy details', async () => {
    const result = enrichResult(await headersPresentRule.run(P({ 'content-type': 'text/html' }), { globals: {} }), headersPresentRule, 'test')
    const copy = toResultCopyPayload(result)
    expect(copy).toContain('https://fullstackoptimization.com/')
    expect(result.details).toBeUndefined()
  })
})
