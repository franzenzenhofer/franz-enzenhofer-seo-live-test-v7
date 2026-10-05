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
  expect(result.presentation?.values.slice(0, 2)).toEqual([
    { key: 'max-video-preview', value: '30, 0', kind: 'text' }, { key: 'Applies to', value: 'all crawlers, googlebot', kind: 'text' }])
  expect(result.presentation?.evidence.map(({ name }) => name)).toEqual(['<meta name="robots">', '<meta name="googlebot">'])
  expect(result.presentation?.evidence[0]?.fields).toContainEqual({ key: 'Crawler', value: 'all crawlers', kind: 'text' })
  expect(result.presentation?.evidence[0]?.fields).toContainEqual({ key: 'Value', value: '30', kind: 'text' })
  expect(result.presentation?.evidence[1]?.fields).toContainEqual({ key: 'Value', value: '0', kind: 'text' })
  expect(result.presentation?.evidence[1]?.fields).toContainEqual({ key: 'Syntax', value: 'Valid', kind: 'text' })
  const copy = toResultCopyPayload(result)
  expect(copy).toContain('googlebot')
  expect(copy).toContain('30')
  expect(copy).not.toContain('[object Object]')
  expect(result.details).toBeUndefined()
})
