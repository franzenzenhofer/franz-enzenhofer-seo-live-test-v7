import { describe, it, expect } from 'vitest'
import { xCacheRule } from '@/rules/http/xCache'

const P = (h: Record<string,string>) => ({ html:'', url:'', doc: new DOMParser().parseFromString('<p/>','text/html'), headers: h })

describe('rule: x-cache', () => {
  it('reports hit/miss', async () => {
    const r = await xCacheRule.run(P({ 'x-cache': 'HIT' }), { globals: {} })
    expect((r as any).message.includes('X-Cache')).toBe(true)
  })
})


it('preserves a mixed result from multiple cache layers', async () => {
  const result = await xCacheRule.run(P({ 'X-Cache': 'MISS, HIT' }), { globals: {} })
  expect(result.message).toContain('Mixed HIT and MISS')
  expect(result.details?.['xCacheHeader']).toBe('MISS, HIT')
})
