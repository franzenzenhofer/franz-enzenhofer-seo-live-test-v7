import { describe, it, expect } from 'vitest'
import { shortlinkRule } from '@/rules/head/shortlink'

const doc = (h: string) => new DOMParser().parseFromString(h, 'text/html')

describe('rule: shortlink', () => {
  it('reports present', async () => {
    const r = await shortlinkRule.run({ html:'', url:'', doc: doc('<link rel="shortlink" href="/s"/>') }, { globals: {} })
    expect((r as any).message.includes('shortlink')).toBe(true)
  })
})

