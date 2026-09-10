import { expect, it } from 'vitest'

import { schemaArticlePresentRule } from '@/rules/schema/articlePresent'

it('names every matching entity and its numbered source block without pretending to validate fields', async () => {
  const html = '<script type="application/ld+json">{"@type":"Article","headline":"First story"}</script><script type="application/ld+json">{"@type":"Article","headline":"Second story"}</script>'
  const result = await schemaArticlePresentRule.run({ html, url: 'https://example.test/', doc: new DOMParser().parseFromString(html, 'text/html') }, { globals: {} })
  expect(result.message).toContain('Found 2 matching entities.')
  expect(result.message).not.toContain('field issues')
  expect(result.details).not.toHaveProperty('issueCount')
  expect(result.details?.['entities']).toEqual(expect.arrayContaining([
    expect.objectContaining({ name: 'First story', sourceBlock: 1, fieldCheck: 'Presence only; fields not checked' }),
    expect.objectContaining({ name: 'Second story', sourceBlock: 2 }),
  ]))
})

it('warns when malformed blocks make article detection incomplete', async () => {
  const html = '<script type="application/ld+json">{"@type":"Article","headline":"Valid story"}</script><script type="application/ld+json">{broken}</script>'
  const result = await schemaArticlePresentRule.run({ html, url: 'https://example.test/', doc: new DOMParser().parseFromString(html, 'text/html') }, { globals: {} })
  expect(result.type).toBe('warn')
  expect(result.message).toContain('the check is incomplete')
  expect(result.details?.['parseErrorCount']).toBe(1)
})
