import { describe, expect, it } from 'vitest'

import { firstPaintRule } from '@/rules/speed/firstPaint'

const basePage = { html: '', url: 'https://ex.com', doc: new DOMParser().parseFromString('<p/>', 'text/html') }
const ctx = { globals: {} }

describe('rule: speed first paint', () => {
  it('returns ok for fast paint', async () => {
    const r = await firstPaintRule.run({ ...basePage, navigationTiming: { firstPaint: 320, firstContentfulPaint: 450 } } as any, ctx as any)
    expect(r.type).toBe('ok')
    expect(r.message).toContain('320ms')
  })

  it('warns for moderately slow paint', async () => {
    const r = await firstPaintRule.run({ ...basePage, navigationTiming: { firstPaint: 900 } } as any, ctx as any)
    expect(r.type).toBe('warn')
  })

  it('reports missing data when paint timing unavailable', async () => {
    const r = await firstPaintRule.run({ ...basePage, navigationTiming: {} } as any, ctx as any)
    expect(r.type).toBe('info')
  })
})
