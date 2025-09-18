import { describe, it, expect } from 'vitest'
import { metaCharsetRule } from '@/rules/head/metaCharset'

const D = (h: string) => new DOMParser().parseFromString(h,'text/html')

describe('rule: meta charset', () => {
  it('shows charset', async () => {
    const r = await metaCharsetRule.run({ html:'', url:'', doc: D('<meta charset="utf-8">') } as any, { globals: {} })
    expect((r as any).message.includes('charset')).toBe(true)
  })
})

