import { afterEach, describe, expect, it, vi } from 'vitest'

import { robotsBlockedResourcesRule as rule } from '@/rules/robots/blockedResources'
import { enrichResult } from '@/core/runHelpers'

const D = () => new DOMParser().parseFromString('<p/>', 'text/html')
const run = async (url: string, resources: string[]) => enrichResult(await rule.run({ html: '', url, doc: D(), resources } as never, { globals: {} }), rule, 'test')
const value = (result: Awaited<ReturnType<typeof run>>, key: string) => result.presentation?.values.find((field) => field.key === key)?.value
const detail = (result: Awaited<ReturnType<typeof run>>, key: string) => result.presentation?.detailValues.find((field) => field.key === key)?.value

describe('rule: robots blocked resources counts', () => {
  afterEach(() => vi.restoreAllMocks())

  it('does not claim cross-origin resources were checked against robots.txt', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => 'User-agent: *\nDisallow:' }))
    const result = await run('https://crossorigincounts.test/page', [
      'https://crossorigincounts.test/a.js',
      'https://crossorigincounts.test/b.css',
      'https://cdn.other.com/c.js',
      'https://fonts.other.com/d.woff2',
      'https://tracker.other.com/e.js',
    ])
    expect(result.type).toBe('ok')
    // Only 2 same-host resources are subject to this robots.txt; the verdict
    // must not claim all 5 were checked.
    expect(value(result, 'Resources checked')).toBe(2)
    expect(value(result, 'robots.txt URL')).toBe('https://crossorigincounts.test/robots.txt')
    expect(detail(result, 'Cross-origin resources')).toBe(3)
    expect(detail(result, 'Resource URLs')).toBe(5)
  })
})
