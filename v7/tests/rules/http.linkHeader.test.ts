import { describe, it, expect } from 'vitest'
import { linkHeaderRule } from '@/rules/http/linkHeader'

const P = (h: Record<string,string>) => ({ html:'', url:'', doc: new DOMParser().parseFromString('<p/>','text/html'), headers: h })

describe('rule: http link header', () => {
  it('reports presence', async () => {
    const r = await linkHeaderRule.run(P({ link: '<https://ex.com>; rel=preload' }), { globals: {} })
    expect((r as any).message.includes('Link header')).toBe(true)
  })
})

