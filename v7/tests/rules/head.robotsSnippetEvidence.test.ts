import { expect, it } from 'vitest'

import { robotsMaxSnippetRule } from '@/rules/head/robotsMaxSnippet'
import { enrichResult } from '@/core/runHelpers'
import { toResultCopyPayload } from '@/components/result/resultCopy'
it('explains zero, unlimited and invalid snippet limits with each responsible crawler and source', async () => {
  const html = '<meta name="robots" content="max-snippet:-1"><meta name="googlebot" content="max-snippet:bad">'
  const result = enrichResult(await robotsMaxSnippetRule.run({ html, url: 'https://example.test',
    doc: new DOMParser().parseFromString(html, 'text/html'), headers: { 'X-Robots-Tag': 'max-snippet:0' },
  }, { globals: {} }), robotsMaxSnippetRule, 'test')
  expect(result.type).toBe('warn')
  const copy = toResultCopyPayload(result)
  expect(copy).toContain('No text snippet is permitted')
  expect(copy).toContain('No explicit maximum')
  expect(copy).toContain('googlebot')
  expect(copy).toContain('X-Robots-Tag HTTP header')
  expect(copy).toContain('max-snippet:bad')
  expect(copy).not.toContain('[object Object]')
  expect(result.details?.['matches']).toBeUndefined()
  expect(result.details?.['parsed']).toBeUndefined()
})
