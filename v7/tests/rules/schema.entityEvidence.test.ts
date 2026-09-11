import { expect, it } from 'vitest'

import { schemaArticlePresentRule } from '@/rules/schema/articlePresent'

it('names every matching entity and its numbered source block without pretending to validate fields', async () => {
  const html = '<script type="application/ld+json">{"@type":"Article","headline":"First story"}</script><script type="application/ld+json">{"@type":"Article","headline":"Second story"}</script>'
  const result = await schemaArticlePresentRule.run({ html, url: 'https://example.test/', doc: new DOMParser().parseFromString(html, 'text/html') }, { globals: {} })
  expect(result.presentation?.values).toContainEqual(expect.objectContaining({ key: 'Matching entities', value: 2 }))
  expect(result.presentation?.evidence).toContainEqual(expect.objectContaining({
    name: 'Entity 1', fields: expect.arrayContaining([
      expect.objectContaining({ key: 'Name', value: 'First story' }),
      expect.objectContaining({ key: 'Source block', value: 1 }),
      expect.objectContaining({ key: 'Field check', value: 'Presence only; fields not checked' }),
    ]),
  }))
  expect(result.presentation?.evidence).toContainEqual(expect.objectContaining({
    name: 'Entity 2', fields: expect.arrayContaining([
      expect.objectContaining({ key: 'Name', value: 'Second story' }), expect.objectContaining({ key: 'Source block', value: 2 }),
    ]),
  }))
  expect(result.presentation?.evidence.flatMap((record) => record.fields)).not.toContainEqual(expect.objectContaining({ key: 'Missing fields' }))
  expect(result.details).toBeUndefined()
})

it('warns when malformed blocks make article detection incomplete', async () => {
  const html = '<script type="application/ld+json">{"@type":"Article","headline":"Valid story"}</script><script type="application/ld+json">{broken}</script>'
  const result = await schemaArticlePresentRule.run({ html, url: 'https://example.test/', doc: new DOMParser().parseFromString(html, 'text/html') }, { globals: {} })
  expect(result.type).toBe('warn')
  expect(result.presentation?.values).toContainEqual(expect.objectContaining({ key: 'JSON-LD parse errors', value: 1 }))
  expect(result.presentation?.evidence).toContainEqual(expect.objectContaining({
    name: 'JSON-LD script 2', fields: expect.arrayContaining([expect.objectContaining({ key: 'Script number', value: 2 })]),
  }))
  expect(result.details).toBeUndefined()
})
