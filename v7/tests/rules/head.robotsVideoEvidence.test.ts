import { expect, it } from 'vitest'

import { robotsMaxVideoPreviewRule } from '@/rules/head/robotsMaxVideoPreview'
import { enrichResult } from '@/core/runHelpers'
import { toResultCopyPayload } from '@/components/result/resultCopy'

it('names each crawler, source and raw value for a limited and a static-image-only instruction', async () => {
  const html = '<meta name="robots" content="max-video-preview:30"><meta name="googlebot" content="max-video-preview:0">'
  const result = enrichResult(await robotsMaxVideoPreviewRule.run({ html, url: 'https://example.test',
    doc: new DOMParser().parseFromString(html, 'text/html'),
  }, { globals: {} }), robotsMaxVideoPreviewRule, 'test')
  expect(result.type).toBe('info')
  expect(result.presentation?.evidence.filter(({ name }) => name.startsWith('Instruction '))).toHaveLength(2)
  expect(result.presentation?.evidence).toContainEqual({ name: 'Instruction 1', fields: [
    { key: 'Crawler', value: 'All crawlers (including Googlebot)', kind: 'text' },
    { key: 'Source', value: 'HTML meta tag', kind: 'text' },
    { key: 'Value', value: '30', kind: 'text' },
    { key: 'Valid', value: 'Yes', kind: 'text' },
  ] })
  expect(result.presentation?.evidence).toContainEqual({ name: 'Instruction 2', fields: [
    { key: 'Crawler', value: 'googlebot', kind: 'text' },
    { key: 'Source', value: 'HTML meta tag', kind: 'text' },
    { key: 'Value', value: '0', kind: 'text' },
    { key: 'Valid', value: 'Yes', kind: 'text' },
  ] })
  const copy = toResultCopyPayload(result)
  expect(copy).toContain('googlebot')
  expect(copy).toContain('30')
  expect(copy).not.toContain('[object Object]')
  expect(result.details).toBeUndefined()
})
