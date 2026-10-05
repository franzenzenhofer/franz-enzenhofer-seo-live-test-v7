import { describe, it, expect } from 'vitest'
import { googleIsConnectedRule } from '@/rules/google/isConnected'
import { enrichResult } from '@/core/runHelpers'

const page = { html: '', url: 'https://ex.com', doc: new DOMParser().parseFromString('<p/>', 'text/html') }

describe('rule: google is connected', () => {
  it('ok when token present', async () => {
    const r = await googleIsConnectedRule.run(page as any, { globals: { googleApiAccessToken: 't' } })
    expect(r.type).toBe('ok')
    expect(r.priority).toBe(850)
    expect(r.presentation?.values).toEqual([{ key: 'Access token', value: 'Found', kind: 'text' }])
    expect(r.presentation?.input).toBe('Extension session state')
  })

  it('info when token absent', async () => {
    const r = await googleIsConnectedRule.run(page as any, { globals: {} })
    expect(r.type).toBe('info')
    expect(r.priority).toBe(900)
    expect(r.presentation?.values).toEqual([{ key: 'Access token', value: 'Not found', kind: 'text' }])
  })

  it('reports no reference URLs by falling back to the default', () => {
    expect(googleIsConnectedRule.meta.references).toEqual([])
  })

  it('never surfaces legacy details', async () => {
    const r = await googleIsConnectedRule.run(page as any, { globals: {} })
    const enriched = enrichResult(r, googleIsConnectedRule, 'test')
    expect(enriched.details).toBeUndefined()
    expect(enriched.presentation?.references).toEqual(['https://fullstackoptimization.com/'])
  })
})
