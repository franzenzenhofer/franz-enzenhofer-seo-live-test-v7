import { describe, it, expect } from 'vitest'
import { imagesLayoutRule } from '@/rules/body/imagesLayout'
import { imagesLazyRule } from '@/rules/body/imagesLazy'

const D = (h: string) => new DOMParser().parseFromString(h,'text/html')

describe('rules: images layout/lazy', () => {
  it('counts missing dimensions and loading', async () => {
    const doc = D('<img src="a.jpg"><img src="b.jpg" width="10" height="10" loading="lazy">')
    const p = { html:'', url:'', doc }
    const r1 = await imagesLayoutRule.run(p as any, { globals: {} })
    const r2 = await imagesLazyRule.run(p as any, { globals: {} })
    expect((r1 as any).type).toBe('warn')
    expect((r2 as any).type).toBe('info')
  })
})

