import { expect, it } from 'vitest'

import { robotsNosnippetRule } from '@/rules/head/robotsNosnippet'
import { enrichResult } from '@/core/runHelpers'
import { toResultCopyPayload } from '@/components/result/resultCopy'
it('distinguishes text restrictions from static-image and indexing permission, preserving named sources', async () => {
  const html = '<meta name="googlebot" content="max-snippet:0">'
  const result = enrichResult(await robotsNosnippetRule.run({ html, url: 'https://example.test',
    doc: new DOMParser().parseFromString(html, 'text/html'), headers: { 'X-Robots-Tag': 'bingbot: nosnippet' },
  }, { globals: {} }), robotsNosnippetRule, 'test')
  expect(result.type).toBe('warn')
  const copy = toResultCopyPayload(result)
  expect(copy).toContain('bingbot')
  expect(copy).toContain('googlebot')
  expect(copy).toContain('max-snippet:0')
  expect(copy).toContain('A static image can still appear')
  expect(copy).toContain('Keep the restriction if it is intentional')
  expect(result.details?.['restrictingInstructions']).toHaveLength(2)
})
