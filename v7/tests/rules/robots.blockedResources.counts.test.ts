import { afterEach, describe, expect, it, vi } from 'vitest'

import { robotsBlockedResourcesRule } from '@/rules/robots/blockedResources'

const doc = () => new DOMParser().parseFromString('<p/>', 'text/html')

describe('rule: robots blocked resources counts', () => {
  afterEach(() => vi.restoreAllMocks())

  it('does not claim cross-host resources were checked against robots.txt', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: async () => 'User-agent: *\nDisallow:' }))
    const page = {
      html: '',
      url: 'https://ex.com/page',
      doc: doc(),
      resources: [
        'https://ex.com/a.js',
        'https://ex.com/b.css',
        'https://cdn.other.com/c.js',
        'https://fonts.other.com/d.woff2',
        'https://tracker.other.com/e.js',
      ],
    }
    const r = await robotsBlockedResourcesRule.run(page as never, { globals: {} })
    expect(r.type).toBe('ok')
    // Only 2 same-host resources are subject to this robots.txt; the message
    // must not claim all 5 were verified as allowed.
    expect(r.message).not.toContain('All 5 resources')
    expect(r.message).toContain('2')
    expect(r.details?.['sameHostCount']).toBe(2)
    expect(r.details?.['crossHostCount']).toBe(3)
  })
})
