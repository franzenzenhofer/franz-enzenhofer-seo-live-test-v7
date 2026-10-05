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
  expect(result.presentation?.evidence).toEqual([{ name: '<meta name="robots">', fields: [
    { key: 'Crawler', value: 'all crawlers', kind: 'text' },
    { key: 'Instruction', value: 'noimageindex', kind: 'text' },
    { key: 'DOM path', value: 'html > head > meta', kind: 'path' },
  ] }])
  const copy = toResultCopyPayload(result)
  expect(copy).toContain('all crawlers')
  expect(copy).toContain('<meta name="robots" content="noimageindex">')
  expect(copy).not.toContain('[object Object]')
  expect(result.details).toBeUndefined()
})
