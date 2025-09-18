import { describe, it, expect } from 'vitest'
import { metaKeywordsRule } from '@/rules/head/metaKeywords'

const doc = (h: string) => new DOMParser().parseFromString(h, 'text/html')

describe('rule: meta keywords', () => {
  it('ok when absent', async () => {
    const r = await metaKeywordsRule.run({ html:'', url:'', doc: doc('<p/>') }, { globals: {} })
    expect((r as any).type).toBe('ok')
  })
})

