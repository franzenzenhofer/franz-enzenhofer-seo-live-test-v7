import { describe, it, expect } from 'vitest'
import { parameterizedLinksRule } from '@/rules/body/parameterizedLinks'

const D = (h: string) => new DOMParser().parseFromString(h, 'text/html')

describe('rule: parameterized links', () => {
  it('counts links with ?', async () => {
    const r = await parameterizedLinksRule.run({ html:'', url:'https://ex.com', doc: D('<a href="/a?x=1">a</a><a href="/b">b</a>') }, { globals: {} })
    expect((r as any).message.includes('parameters:')).toBe(true)
  })
})

