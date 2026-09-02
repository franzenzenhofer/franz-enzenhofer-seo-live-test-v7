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
    expect(String((r1 as any).details?.note)).toContain('aspect-ratio')
    expect((r2 as any).type).toBe('info')
    expect((r2 as any).message).toContain('1 lazy')
    expect((r2 as any).message).toContain('1 without loading attribute')
    expect((r2 as any).details?.unsetCount).toBe(1)
  })

  it('reports info, not ok, when every image carries a loading attribute', async () => {
    const doc = D('<img src="a.jpg" loading="lazy"><img src="b.jpg" loading="eager">')
    const r = await imagesLazyRule.run({ html:'', url:'', doc } as any, { globals: {} })
    expect((r as any).type).toBe('info')
    expect((r as any).message).toContain('1 lazy, 1 eager, 0 without loading attribute')
    expect((r as any).details?.lazyCount).toBe(1)
    expect((r as any).details?.eagerCount).toBe(1)
  })
})
