import { describe, expect, it } from 'vitest'

import { pageObjectRule } from '@/rules/debug/pageObject'

describe('rule: debug page object', () => {
  it('returns info with summary', async () => {
    const p = { html: '', url: 'https://ex.com', doc: new DOMParser().parseFromString('<p/>', 'text/html'), status: 200, headers: { Status: '200' } }
    const r = await pageObjectRule.run(p as any, { globals: {} })
    expect(r.type).toBe('info')
    expect((r.details as any)?.summary?.url).toBe('https://ex.com')
  })
})
