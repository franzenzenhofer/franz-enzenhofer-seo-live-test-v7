import { describe, expect, it } from 'vitest'

import { firstPaintRule } from '@/rules/speed/firstPaint'

const basePage = { html: '', url: 'https://ex.com', doc: new DOMParser().parseFromString('<p/>', 'text/html') }
const ctx = { globals: {} }

describe('rule: speed first paint', () => {
  it('returns ok for good FCP (<= 1800ms)', async () => {
    const r = await firstPaintRule.run({ ...basePage, navigationTiming: { firstPaint: 320, firstContentfulPaint: 450 } } as any, ctx as any)
    expect(r.type).toBe('ok')
    expect(r.message).toContain('450ms')
  })

  it('warns for FCP needing improvement (1800-3000ms)', async () => {
    const r = await firstPaintRule.run({ ...basePage, navigationTiming: { firstPaint: 900, firstContentfulPaint: 2200 } } as any, ctx as any)
    expect(r.type).toBe('warn')
  })

  it('errors for poor FCP (> 3000ms)', async () => {
    const r = await firstPaintRule.run({ ...basePage, navigationTiming: { firstPaint: 900, firstContentfulPaint: 3400 } } as any, ctx as any)
    expect(r.type).toBe('error')
  })

  it('reports info-only when only first paint is available', async () => {
    const r = await firstPaintRule.run({ ...basePage, navigationTiming: { firstPaint: 900 } } as any, ctx as any)
    expect(r.type).toBe('info')
    expect(r.message).toContain('900ms')
  })

  it('reports missing data when paint timing unavailable', async () => {
    const r = await firstPaintRule.run({ ...basePage, navigationTiming: {} } as any, ctx as any)
    expect(r.type).toBe('info')
  })
})
