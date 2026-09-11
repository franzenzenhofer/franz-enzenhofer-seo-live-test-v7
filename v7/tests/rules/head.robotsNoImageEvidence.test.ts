import { expect, it } from 'vitest'

import { robotsNoImageIndexRule } from '@/rules/head/robotsNoImageIndex'
import { enrichResult } from '@/core/runHelpers'
import { toResultCopyPayload } from '@/components/result/resultCopy'

it('names an image-indexing restriction without implying that page indexing or other image sources are blocked', async () => {
  const html = '<meta name="robots" content="noimageindex">'
  const result = enrichResult(await robotsNoImageIndexRule.run({ html, url: 'https://example.test',
    doc: new DOMParser().parseFromString(html, 'text/html'),
  }, { globals: {} }), robotsNoImageIndexRule, 'test')
  expect(result.type).toBe('warn')
  expect(result.presentation?.evidence).toEqual([{ name: 'Instruction 1', fields: [
    { key: 'Crawler', value: 'All crawlers (including Googlebot)', kind: 'text' },
    { key: 'Source', value: 'HTML meta tag', kind: 'text' },
    { key: 'Instruction', value: 'noimageindex', kind: 'text' },
    { key: 'DOM path', value: 'html > head > meta', kind: 'text' },
  ] }])
  const copy = toResultCopyPayload(result)
  expect(copy).toContain('All crawlers')
  expect(copy).toContain('HTML meta tag')
  expect(copy).not.toContain('[object Object]')
  expect(result.details).toBeUndefined()
})
