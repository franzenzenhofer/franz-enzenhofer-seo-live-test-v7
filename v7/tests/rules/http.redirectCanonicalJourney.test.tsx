import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it } from 'vitest'

import { redirectCanonicalChainRule } from '@/rules/http/redirectCanonicalChain'
import { toResultCopyPayload } from '@/components/result/resultCopy'
import { ResultDetails } from '@/components/result/ResultDetails'
it('shows named responses and the canonical separately, without inventing a response for history updates', async () => {
  const html = '<link rel="canonical" href="https://example.test/new">'
  const result = await redirectCanonicalChainRule.run({ html, url: 'https://example.test/new',
    doc: new DOMParser().parseFromString(html, 'text/html'),
    headerChain: [{ url: 'https://example.test/old', status: 308, location: '/new' }, { url: 'https://example.test/new', status: 200 }],
  }, { globals: { navigationLedger: { tabId: 1, currentUrl: 'https://example.test/new', trace: [
    { url: 'https://example.test/old', type: 'http_redirect', timestamp: 1, statusCode: 308 },
    { url: 'https://example.test/new', type: 'load', timestamp: 2, statusCode: 200 },
    { url: 'https://example.test/new', type: 'history_api', timestamp: 3, statusCode: 200 },
  ] } } })
  const ui = renderToStaticMarkup(<ResultDetails details={result.details} />)
  expect(ui).toContain('HTTP 308 Permanent Redirect')
  expect(ui).toContain('Browser history updated')
  expect(ui).toContain('Canonical declaration')
  const copy = toResultCopyPayload(result)
  expect(copy).toContain('The address stayed the same')
  expect(copy).toContain('https://example.test/new')
  expect(result.details?.['trace']).toBeUndefined()
  expect(result.details?.['headerChain']).toBeUndefined()
})
