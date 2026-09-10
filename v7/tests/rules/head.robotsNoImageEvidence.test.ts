import { expect, it } from 'vitest'

import { robotsNoImageIndexRule } from '@/rules/head/robotsNoImageIndex'
import { enrichResult } from '@/core/runHelpers'
import { toResultCopyPayload } from '@/components/result/resultCopy'
it('names an image-indexing restriction without implying that page indexing or other image sources are blocked', async () => {
  const html = '<meta name="robots" content="noimageindex">'
  const result = enrichResult(await robotsNoImageIndexRule.run({ html, url: 'https://example.test',
    doc: new DOMParser().parseFromString(html, 'text/html'),
  }, { globals: {} }), robotsNoImageIndexRule, 'test')
  const copy = toResultCopyPayload(result)
  expect(copy).toContain('All crawlers')
  expect(copy).toContain('HTML meta tag')
  expect(copy).toContain('does not block indexing of the page itself')
  expect(copy).toContain('image exclusion is intentional')
  expect(result.details?.['restrictingInstructions']).toHaveLength(1)
})
