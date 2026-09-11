import { expect, it } from 'vitest'

import { enrichResult } from '@/core/runHelpers'
import { redirectCanonicalChainRule } from '@/rules/http/redirectCanonicalChain'
import { toResultCopyPayload } from '@/components/result/resultCopy'
it('shows named responses and the canonical separately, without inventing a response for history updates', async () => {
  const html = '<link rel="canonical" href="https://example.test/new">'
  const result = enrichResult(await redirectCanonicalChainRule.run({ html, url: 'https://example.test/new',
    doc: new DOMParser().parseFromString(html, 'text/html'),
    headerChain: [{ url: 'https://example.test/old', status: 308, location: '/new' }, { url: 'https://example.test/new', status: 200 }],
  }, { globals: { navigationLedger: { tabId: 1, currentUrl: 'https://example.test/new', trace: [
    { url: 'https://example.test/old', type: 'http_redirect', timestamp: 1, statusCode: 308 },
    { url: 'https://example.test/new', type: 'load', timestamp: 2, statusCode: 200 },
    { url: 'https://example.test/new', type: 'history_api', timestamp: 3, statusCode: 200 },
  ] } } }), redirectCanonicalChainRule, 'test')
  const hops = result.presentation?.evidence.filter((record) => record.name.startsWith('Hop ')) ?? []
  expect(hops.map((hop) => hop.fields.find((field) => field.key === 'Status')?.value)).toEqual(['HTTP 308 Permanent Redirect', 'HTTP 200 OK', undefined])
  expect(hops[2]?.fields).toContainEqual({ key: 'Event type', value: 'Browser history updated', kind: 'text' })
  expect(result.presentation?.markup.map((field) => field.value)).toEqual([html])
  const copy = toResultCopyPayload(result)
  expect(copy).toContain('Status: HTTP 308 Permanent Redirect')
  expect(copy).toContain('https://example.test/new')
  expect(result.details).toBeUndefined()
})
