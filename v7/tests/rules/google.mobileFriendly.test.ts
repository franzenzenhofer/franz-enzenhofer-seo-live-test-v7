import { afterEach, describe, expect, it, vi } from 'vitest'

import { mobileFriendlyRule } from '@/rules/google/mobileFriendly'

const page = { html: '', url: 'https://example.com', doc: new DOMParser().parseFromString('<p/>', 'text/html') }

describe('rule: mobile friendly test', () => {
  afterEach(() => vi.restoreAllMocks())

  it('returns ok when mobile-friendly', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ mobileFriendly: 'MOBILE_FRIENDLY', mobileFriendlyIssues: [] }),
    }))
    const r = await mobileFriendlyRule.run(page as any, { globals: { variables: { google_mobile_friendly_test_key: 'k' } } })
    expect(r.type).toBe('ok')
  })

  it('errors when key missing', async () => {
    const r = await mobileFriendlyRule.run(page as any, { globals: { variables: {} } })
    expect(r.type).toBe('runtime_error')
  })
})
