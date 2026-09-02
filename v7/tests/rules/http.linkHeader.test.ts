import { describe, it, expect } from 'vitest'
import { linkHeaderRule } from '@/rules/http/linkHeader'

const P = (h: Record<string,string>) => ({ html:'', url:'', doc: new DOMParser().parseFromString('<p/>','text/html'), headers: h })

describe('rule: http link header', () => {
  it('reports presence', async () => {
    const r = await linkHeaderRule.run(P({ link: '<https://ex.com>; rel=preload' }), { globals: {} })
    expect((r as any).message.includes('Link header')).toBe(true)
    expect((r as any).details.count).toBe(1)
  })
  it('splits link-values only on top-level commas per RFC 8288', async () => {
    const header = '<https://ex.com/x>; rel="canonical"; title="Products, Sale", <https://ex.com/a,b>; rel="alternate"'
    const r = await linkHeaderRule.run(P({ link: header }), { globals: {} })
    expect((r as any).details.count).toBe(2)
    expect((r as any).details.links[0]).toContain('title="Products, Sale"')
    expect((r as any).details.links[1]).toContain('<https://ex.com/a,b>')
  })
  it('counts plain multi-value headers', async () => {
    const header = '<https://ex.com/a>; rel=preload, <https://ex.com/b>; rel=prefetch'
    const r = await linkHeaderRule.run(P({ link: header }), { globals: {} })
    expect((r as any).details.count).toBe(2)
  })
})
