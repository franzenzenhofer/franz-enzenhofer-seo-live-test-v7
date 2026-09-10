import { expect, it } from 'vitest'

import { imagesLayoutRule } from '@/rules/body/imagesLayout'
import { toResultCopyPayload } from '@/components/result/resultCopy'
it('identifies each affected image and the specific missing attribute in the copied result', async () => {
  const html = '<img src="/trip.jpg" alt="Alpe-Adria 8 Tage" width="1200"><img src="/map.jpg" alt="Route map">'
  const result = await imagesLayoutRule.run({ html, url: 'https://example.test', doc: new DOMParser().parseFromString(html, 'text/html') }, { globals: {} })
  const images = result.details?.['affectedImages'] as Array<{ missingAttributes: string[] }>
  expect(images[0]?.missingAttributes).toEqual(['height'])
  expect(images[1]?.missingAttributes).toEqual(['width', 'height'])
  const copy = toResultCopyPayload(result)
  expect(copy).toContain('Alpe-Adria 8 Tage')
  expect(copy).toContain('/map.jpg')
  expect(copy).toContain('CSS aspect-ratio')
  expect(copy).not.toContain('[object Object]')
})
it('makes an empty check explicit rather than claiming all images have dimensions', async () => {
  const result = await imagesLayoutRule.run({ html: '', url: '', doc: new DOMParser().parseFromString('', 'text/html') }, { globals: {} })
  expect(result.type).toBe('info')
  expect(result.message).toContain('No img elements')
})
