import { describe, expect, it } from 'vitest'

import { enrichResult } from '@/core/runHelpers'
import { firstPaintRule as rule } from '@/rules/speed/firstPaint'
import { presentationSchema } from '@/shared/presentation/schema'

const basePage = { html: '', url: 'https://ex.com', doc: new DOMParser().parseFromString('<p/>', 'text/html') }
const ctx = { globals: {} }
const run = async (navigationTiming: Record<string, number | undefined>) =>
  enrichResult(await rule.run({ ...basePage, navigationTiming } as never, ctx), rule, 'test')
const value = (result: Awaited<ReturnType<typeof run>>, key: string) => result.presentation?.values.find((field) => field.key === key)?.value

describe('rule: speed first paint', () => {
  it('returns ok for good FCP (<= 1800ms)', async () => {
    const result = await run({ firstPaint: 320, firstContentfulPaint: 450 })
    expect(result.type).toBe('ok'); expect(result.priority).toBe(850)
    expect(value(result, 'Contentful paint')).toBe('450ms'); expect(value(result, 'First paint')).toBe('320ms')
    expect(result.presentation?.input).toBe('Navigation timing')
    expect(result.details).toBeUndefined()
    expect(presentationSchema.safeParse(result.presentation).success).toBe(true)
  })

  it('warns for FCP needing improvement (1800-3000ms)', async () => {
    const result = await run({ firstPaint: 900, firstContentfulPaint: 2200 })
    expect(result.type).toBe('warn'); expect(result.priority).toBe(400)
  })

  it('errors for poor FCP (> 3000ms)', async () => {
    const result = await run({ firstPaint: 900, firstContentfulPaint: 3400 })
    expect(result.type).toBe('error'); expect(result.priority).toBe(120)
  })

  it('reports info-only when only first paint is available', async () => {
    const result = await run({ firstPaint: 900 })
    expect(result.type).toBe('info'); expect(result.priority).toBe(750)
    expect(value(result, 'First paint')).toBe('900ms'); expect(value(result, 'Contentful paint')).toBe('Not found')
  })

  it('reports missing data when paint timing unavailable', async () => {
    const result = await run({})
    expect(result.type).toBe('info'); expect(result.priority).toBe(900)
    expect(value(result, 'First paint')).toBe('Not found')
    expect(result.presentation?.input).toBe('Navigation timing')
  })

  it('reports Not captured input when no navigation timing was captured', async () => {
    const result = enrichResult(await rule.run(basePage as never, ctx), rule, 'test')
    expect(result.type).toBe('info'); expect(result.priority).toBe(900)
    expect(result.presentation?.input).toBe('Not captured')
    expect(result.presentation?.values).toEqual([{ key: 'Paint timing', value: 'Not captured', kind: 'text' }])
  })

  it('omits the first paint row when it is the same millisecond as the contentful paint', async () => {
    const result = await run({ firstPaint: 450, firstContentfulPaint: 450 })
    expect(result.presentation?.values).toEqual([{ key: 'Contentful paint', value: '450ms', kind: 'text' }])
  })

  it('reports a runtime error when FCP rounds to a non-positive value', async () => {
    const result = await run({ firstPaint: 10, firstContentfulPaint: 0.2 })
    expect(result.type).toBe('runtime_error'); expect(result.priority).toBe(10)
    expect(value(result, 'Contentful paint')).toBe('0ms')
  })
})
