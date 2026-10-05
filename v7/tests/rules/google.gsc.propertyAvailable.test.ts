import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/rules/google/google-gsc-utils', () => ({
  deriveGscProperty: vi.fn(),
}))

import { deriveGscProperty } from '@/rules/google/google-gsc-utils'
import { gscPropertyAvailableRule } from '@/rules/google/gsc/propertyAvailable'

const page = { html: '', url: 'https://example.com/page', doc: new DOMParser().parseFromString('<p/>', 'text/html') }

describe('rule: gsc property available', () => {
  afterEach(() => vi.restoreAllMocks())

  it('reports not signed in when no token is stored', async () => {
    const r = await gscPropertyAvailableRule.run(page as any, { globals: {} })
    expect(r.type).toBe('runtime_error')
    expect(r.priority).toBe(-1000)
    expect(r.presentation?.input).toBe('Extension session state')
  })

  it('reports the found url-prefix property', async () => {
    vi.mocked(deriveGscProperty).mockResolvedValue({ property: 'https://example.com/', type: 'url-prefix' })
    const r = await gscPropertyAvailableRule.run(page as any, { globals: { googleApiAccessToken: 't' } })
    expect(r.type).toBe('ok')
    expect(r.priority).toBe(800)
    expect(r.presentation?.values).toEqual([{ key: 'GSC property', value: 'https://example.com/', kind: 'url' }])
    expect(r.presentation?.input).toBe('Page URL + Search Console API response')
  })

  it('reports the found domain property', async () => {
    vi.mocked(deriveGscProperty).mockResolvedValue({ property: 'sc-domain:example.com', type: 'domain' })
    const r = await gscPropertyAvailableRule.run(page as any, { globals: { googleApiAccessToken: 't' } })
    expect(r.type).toBe('ok')
    expect(r.presentation?.values).toEqual([{ key: 'GSC property', value: 'sc-domain:example.com', kind: 'text' }])
    expect(r.presentation?.detailValues.find((f) => f.key === 'Property type')?.value).toBe('Domain property')
  })

  it('reports a runtime error when no property can be confirmed', async () => {
    vi.mocked(deriveGscProperty).mockResolvedValue(null)
    const r = await gscPropertyAvailableRule.run(page as any, { globals: { googleApiAccessToken: 't' } })
    expect(r.type).toBe('runtime_error')
    expect(r.priority).toBe(-1000)
    expect(r.presentation?.values).toEqual([{ key: 'GSC property', value: 'Not found', kind: 'text' }])
  })

  it('never surfaces legacy details', async () => {
    vi.mocked(deriveGscProperty).mockResolvedValue({ property: 'https://example.com/', type: 'url-prefix' })
    const r = await gscPropertyAvailableRule.run(page as any, { globals: { googleApiAccessToken: 't' } })
    expect((r as any).details).toBeUndefined()
  })
})
