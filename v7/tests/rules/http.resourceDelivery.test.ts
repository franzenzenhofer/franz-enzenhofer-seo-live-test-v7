import { describe, expect, it } from 'vitest'

import { resourceDeliveryRule } from '@/rules/http/resourceDelivery'
import { enrichResult } from '@/core/runHelpers'
import { toResultCopyPayload } from '@/components/result/resultCopy'
import type { ResourceFact } from '@/shared/resourceFacts'

const page = (facts?: ResourceFact[], coverage?: Record<string, unknown>) => ({
  html: '', url: 'https://ex.test/', doc: new DOMParser().parseFromString('<p/>', 'text/html'),
  resourceFacts: facts, resourceCoverage: coverage,
})
const run = async (facts?: ResourceFact[], coverage?: Record<string, unknown>) =>
  enrichResult(await resourceDeliveryRule.run(page(facts, coverage) as never, { globals: {} }), resourceDeliveryRule, 'test')

describe('rule: observed resource delivery', () => {
  it('reports failed subresources with their named status or network error', async () => {
    const result = await run([
      { url: 'https://ex.test/a.js', type: 'script', status: 200, headers: { 'content-type': 'text/javascript', 'content-encoding': 'br', 'cache-control': 'max-age=60' } },
      { url: 'https://ex.test/b.css', type: 'stylesheet', status: 404, headers: { 'content-type': 'text/css' } },
      { url: 'https://ex.test/c.png', type: 'image', error: 'net::ERR_CONNECTION_RESET' },
    ])
    expect(result.type).toBe('error')
    expect(result.priority).toBe(200)
    expect(result.presentation?.values).toContainEqual(expect.objectContaining({ key: 'Failed', value: 2 }))
    expect(result.presentation?.values).toContainEqual({ key: 'Failed URL 1', value: 'https://ex.test/b.css', kind: 'url' })
    expect(result.presentation?.values).toContainEqual({ key: 'Types', value: 'script, stylesheet, image', kind: 'text' })
    expect(result.presentation?.evidence).toContainEqual(expect.objectContaining({
      name: 'Failed resource 1',
      fields: expect.arrayContaining([expect.objectContaining({ key: 'Status', value: 'HTTP 404 Not Found' })]),
    }))
    expect(result.presentation?.evidence).toContainEqual(expect.objectContaining({
      name: 'Failed resource 2',
      fields: expect.arrayContaining([expect.objectContaining({ key: 'Error', value: 'net::ERR_CONNECTION_RESET' })]),
    }))
  })

  it('summarizes compression and cache validators without refetching anything', async () => {
    const result = await run([
      { url: 'https://ex.test/a.js', status: 200, headers: { 'content-type': 'application/javascript' } },
      { url: 'https://ex.test/b.css', status: 200, headers: { 'content-type': 'text/css', 'content-encoding': 'gzip', etag: 'W/"1"' } },
      { url: 'https://ex.test/c.png', status: 200, headers: { 'content-type': 'image/png', 'cache-control': 'max-age=3600' } },
    ])
    expect(result.type).toBe('info')
    expect(result.priority).toBe(820)
    expect(result.presentation?.values).toContainEqual(expect.objectContaining({ key: 'Uncompressed textual', value: 1 }))
    expect(result.presentation?.values).toContainEqual(expect.objectContaining({ key: 'No cache validator', value: 1 }))
    expect(result.presentation?.checked).toContainEqual(expect.objectContaining({ key: 'Scope', value: expect.stringContaining('nothing refetched') }))
  })

  it('reports retained/omitted counts when the ledger was truncated', async () => {
    const coverage = { events: 5000, completed: 4000, retained: 1000, dropped: 3000, truncated: true }
    const result = await run([{ url: 'https://ex.test/a.js', status: 200 }], coverage)
    expect(result.presentation?.detailValues).toContainEqual(expect.objectContaining({ key: 'Retained URLs', value: 1000 }))
    expect(result.presentation?.detailValues).toContainEqual(expect.objectContaining({ key: 'Dropped observations', value: 3000 }))
  })

  it('bounds evidence to 10 records per category and reports the omitted count', async () => {
    const failing: ResourceFact[] = Array.from({ length: 15 }, (_, index) => ({ url: `https://ex.test/f${index}.js`, status: 500 }))
    const result = await run(failing)
    expect(result.presentation?.evidence.filter((record) => record.name.startsWith('Failed resource'))).toHaveLength(10)
    expect(result.presentation?.detailValues).toContainEqual(expect.objectContaining({ key: 'Failed resource records', value: '10 of 15' }))
  })

  it('does not pretend to have evidence when nothing was retained', async () => {
    const observed = await run([], { events: 12, completed: 0, retained: 0, dropped: 0, truncated: false })
    expect(observed.type).toBe('info')
    expect(observed.presentation?.input).toBe('Navigation events')
    expect(observed.presentation?.values).toContainEqual(expect.objectContaining({ key: 'Retained responses', value: 'None' }))

    const none = await run(undefined)
    expect(none.presentation?.input).toBe('Navigation events')
    expect(none.presentation?.values).toContainEqual(expect.objectContaining({ key: 'Subresource requests', value: 'Not checked' }))
  })

  it('links resource URLs and preserves references without advice', async () => {
    const result = await run([{ url: 'https://ex.test/b.css', status: 404 }])
    const copy = toResultCopyPayload(result)
    for (const value of ['https://ex.test/b.css', ...resourceDeliveryRule.meta.references]) expect(copy).toContain(value)
    expect(result.details).toBeUndefined()
  })
})
