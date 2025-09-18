import { describe, it, expect } from 'vitest'
import { relAlternateMediaRule } from '@/rules/head/relAlternateMedia'

const doc = (h: string) => new DOMParser().parseFromString(h, 'text/html')

describe('rule: rel alternate media', () => {
  it('counts media links', async () => {
    const r = await relAlternateMediaRule.run({ html:'', url:'', doc: doc('<link rel="alternate" media="only screen and (max-width: 640px)" href="m.html"/>') }, { globals: {} })
    expect((r as any).message.includes('rel=alternate')).toBe(true)
  })
})

