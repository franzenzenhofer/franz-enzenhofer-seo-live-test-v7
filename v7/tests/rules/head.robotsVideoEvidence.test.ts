import { expect, it } from 'vitest'

import { robotsMaxVideoPreviewRule } from '@/rules/head/robotsMaxVideoPreview'
import { toResultCopyPayload } from '@/components/result/resultCopy'
it('explains video limits in seconds and distinguishes a static image from no preview', async () => {
  const html = '<meta name="robots" content="max-video-preview:30"><meta name="googlebot" content="max-video-preview:0">'
  const result = await robotsMaxVideoPreviewRule.run({ html, url: 'https://example.test',
    doc: new DOMParser().parseFromString(html, 'text/html'),
  }, { globals: {} })
  expect(result.type).toBe('info')
  const copy = toResultCopyPayload(result)
  expect(copy).toContain('Maximum 30 seconds')
  expect(copy).toContain('At most a static image')
  expect(copy).toContain('googlebot')
  expect(result.details?.['declaredLimits']).toHaveLength(2)
})
