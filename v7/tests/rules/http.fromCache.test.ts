import { describe, expect, it } from 'vitest'

import { fromCacheRule } from '@/rules/http/fromCache'
import { enrichResult } from '@/core/runHelpers'
import { toResultCopyPayload } from '@/components/result/resultCopy'

const P = (fromCache?: boolean, headers: Record<string, string> | undefined = { 'content-type': 'text/html' }) =>
  ({ html: '', url: 'https://ex.com', doc: new DOMParser().parseFromString('<p/>', 'text/html'), fromCache, headers })
const run = async (fromCache?: boolean, headers?: Record<string, string>) =>
  enrichResult(await fromCacheRule.run(P(fromCache, headers) as never, { globals: {} }), fromCacheRule, 'test')

describe('rule: from cache', () => {
  it('returns runtime_error when headers not captured', async () => {
    const result = await run(true, {})
    expect(result.type).toBe('runtime_error')
    expect(result.priority).toBe(50)
  })

  it('warns when served from cache', async () => {
    const result = await run(true)
    expect(result.type).toBe('warn')
    expect(result.priority).toBe(150)
    expect(result.presentation?.values).toContainEqual(expect.objectContaining({ key: 'Cache source', value: 'Browser cache' }))
  })

  it('reports info when not from cache', async () => {
    const result = await run(false)
    expect(result.type).toBe('info')
    expect(result.priority).toBe(850)
    expect(result.presentation?.values).toContainEqual(expect.objectContaining({ key: 'Cache source', value: 'Network' }))
  })

  it('reports unknown cache source when nothing indicates otherwise', async () => {
    const result = await run(undefined)
    expect(result.type).toBe('info')
    expect(result.presentation?.values).toContainEqual(expect.objectContaining({ key: 'Cache source', value: 'Unknown' }))
  })

  it('copies status and references without advice', async () => {
    const result = await run(true)
    const copy = toResultCopyPayload(result)
    for (const value of ['Cache source: Browser cache', ...fromCacheRule.meta.references]) expect(copy).toContain(value)
    expect(result.details).toBeUndefined()
  })
})
