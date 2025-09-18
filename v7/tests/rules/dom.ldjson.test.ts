import { describe, it, expect } from 'vitest'
import { ldjsonRule } from '@/rules/dom/ldjson'

const doc = (h: string) => new DOMParser().parseFromString(h, 'text/html')

describe('rule: ldjson', () => {
  it('counts ld+json', async () => {
    const r = await ldjsonRule.run({ html:'', url:'', doc: doc('<script type="application/ld+json">{}</script>') }, { globals: {} })
    expect((r as any).message.includes('ld+json')).toBe(true)
  })
})

