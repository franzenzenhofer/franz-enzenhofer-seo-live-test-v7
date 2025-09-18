import { describe, it, expect } from 'vitest'
import { ampCacheUrlRule } from '@/rules/google/ampCacheUrl'

const D = (h: string) => new DOMParser().parseFromString(h, 'text/html')

describe('rule: amp cache url', () => {
  it('derives cache url from amphtml', async () => {
    const r = await ampCacheUrlRule.run({ html:'', url:'https://ex.com', doc: D('<link rel="amphtml" href="https://ex.com/amp">') }, { globals: {} })
    expect((r as any).message.includes('AMP Cache')).toBe(true)
  })
})

