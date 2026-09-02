import { afterEach, describe, expect, it, vi } from 'vitest'

import { robotsBlockedResourcesRule } from '@/rules/robots/blockedResources'

const D = () => new DOMParser().parseFromString('<p/>', 'text/html')
const stub = (txt: string) =>
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => txt }))

describe('rule: robots blocked resources', () => {
  afterEach(() => vi.restoreAllMocks())

  it('warns when a resource is disallowed', async () => {
    stub('User-agent: *\nDisallow: /blocked')
    const page = { html: '', url: 'https://ex.com/page', doc: D(), resources: ['https://ex.com/blocked/a.js', 'https://ex.com/open/b.js'] }
    const r = await robotsBlockedResourcesRule.run(page as never, { globals: {} })
    expect(r.type).toBe('warn')
  })

  it('treats an equally specific allow/disallow tie as allowed (least restrictive rule wins)', async () => {
    stub('User-agent: *\nAllow: /assets\nDisallow: /assets')
    const page = { html: '', url: 'https://tie.test/page', doc: D(), resources: ['https://tie.test/assets/a.js'] }
    const r = await robotsBlockedResourcesRule.run(page as never, { globals: {} })
    expect(r.type).toBe('ok')
    expect(r.details?.['blockedCount']).toBe(0)
  })
})
