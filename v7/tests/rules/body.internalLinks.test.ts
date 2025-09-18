import { describe, it, expect } from 'vitest'
import { internalLinksRule } from '@/rules/body/internalLinks'

const D = (h: string) => new DOMParser().parseFromString(h, 'text/html')

describe('rule: internal links', () => {
  it('counts internal and external', async () => {
    const r = await internalLinksRule.run({ html:'', url:'https://ex.com/a', doc: D('<a href="/x">i</a><a href="https://ex.com/y">i</a><a href="https://foo.com">e</a>') }, { globals: {} })
    expect((r as any).message.includes('internal')).toBe(true)
  })
})

