import { describe, it, expect } from 'vitest'
import { googlebotMetaRule } from '@/rules/head/googlebotMeta'

const D = (h: string) => new DOMParser().parseFromString(h, 'text/html')

describe('rule: meta googlebot', () => {
  it('reads content', async () => {
    const r = await googlebotMetaRule.run({ html:'', url:'', doc: D('<meta name="googlebot" content="noindex">') } as any, { globals: {} })
    expect((r as any).message.includes('noindex')).toBe(true)
  })
})

