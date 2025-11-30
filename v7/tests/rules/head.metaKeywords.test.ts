import { describe, it, expect } from 'vitest'
import { metaKeywordsRule } from '@/rules/head/metaKeywords'

const doc = (h: string) => new DOMParser().parseFromString(h, 'text/html')

describe('rule: meta keywords', () => {
  it('ok when absent', async () => {
    const r = await metaKeywordsRule.run({ html:'', url:'', doc: doc('<p/>') }, { globals: {} })
    expect((r as any).type).toBe('info')
  })

  it('warns when present', async () => {
    const r = await metaKeywordsRule.run({ html:'', url:'', doc: doc('<meta name="keywords" content="seo,search"/>') }, { globals: {} })
    expect((r as any).type).toBe('warn')
  })

  it('warns when empty', async () => {
    const r = await metaKeywordsRule.run({ html:'', url:'', doc: doc('<meta name="keywords" content="   "/>') }, { globals: {} })
    expect((r as any).type).toBe('warn')
  })
})
