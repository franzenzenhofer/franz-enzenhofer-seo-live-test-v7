import { describe, it, expect } from 'vitest'
import { trailingSlashRule } from '@/rules/url/trailingSlash'

const D = (h: string) => new DOMParser().parseFromString(h, 'text/html')

describe('rule: trailing slash', () => {
  it('warns inconsistency', async () => {
    const p = { html:'', url:'https://ex.com/a', doc: D('<link rel="canonical" href="https://ex.com/a/">') }
    const r = await trailingSlashRule.run(p as any, { globals: {} })
    expect((r as any).type).toBe('warn')
  })
})

