import { expect, it } from 'vitest'

import { schemaArticlePresentRule } from '@/rules/schema/articlePresent'

const LABEL = '<script type="application/ld+json">'

it('names every matching entity inside the record of its own script without pretending to validate fields', async () => {
  const html = `${LABEL}{"@type":"Article","headline":"First story"}</script>${LABEL}{"@type":"Article","headline":"Second story"}</script>`
  const result = await schemaArticlePresentRule.run({ html, url: 'https://example.test/', doc: new DOMParser().parseFromString(html, 'text/html') }, { globals: {} })
  expect(result.presentation?.values).toContainEqual(expect.objectContaining({ key: 'Types', value: 'Article' }))
  expect(result.presentation?.values).toContainEqual(expect.objectContaining({ key: 'Matching entities', value: 2 }))
  // One evidence record per <script>, numbered, each carrying the entity it declares and one DOM path.
  expect(result.presentation?.evidence.map((record) => record.name)).toEqual([`${LABEL} 1`, `${LABEL} 2`])
  expect(result.presentation?.evidence[0]?.fields).toEqual([
    { key: 'Types', value: 'Article', kind: 'text' }, { key: 'Article', value: 'First story', kind: 'text' },
    expect.objectContaining({ key: 'DOM path', kind: 'path' }),
  ])
  expect(result.presentation?.evidence[1]?.fields).toContainEqual({ key: 'Article', value: 'Second story', kind: 'text' })
  const keys = result.presentation?.evidence.flatMap((record) => record.fields.map((field) => field.key)) || []
  expect(keys.filter((key) => / fields$/.test(key))).toEqual([])
  expect(result.presentation?.markup.map((field) => field.key)).toEqual([`${LABEL} 1`, `${LABEL} 2`])
  expect(result.presentation?.detailValues).toEqual([
    { key: 'Markup retained', value: 2, kind: 'text' }, { key: 'Markup omitted', value: 0, kind: 'text' },
    { key: 'Evidence retained', value: 2, kind: 'text' }, { key: 'Evidence omitted', value: 0, kind: 'text' },
  ])
  expect(result.details).toBeUndefined()
})

it('warns when malformed blocks make article detection incomplete and names the broken script', async () => {
  const html = `${LABEL}{"@type":"Article","headline":"Valid story"}</script>${LABEL}{broken}</script>`
  const result = await schemaArticlePresentRule.run({ html, url: 'https://example.test/', doc: new DOMParser().parseFromString(html, 'text/html') }, { globals: {} })
  expect(result.type).toBe('warn')
  expect(result.presentation?.values).toContainEqual({ key: 'Parse errors', value: 'script 2', kind: 'text' })
  expect(result.presentation?.evidence[1]?.fields).toEqual(expect.arrayContaining([
    { key: 'Types', value: 'None', kind: 'text' }, { key: 'Syntax', value: 'Invalid JSON', kind: 'text' }, expect.objectContaining({ key: 'Error' }),
  ]))
  expect(result.details).toBeUndefined()
})

it('shows a short broken script in the overview and keeps a single entity out of the count rows', async () => {
  const html = `${LABEL}{"@type":"NewsArticle","headline":"Only story"}</script>`
  const result = await schemaArticlePresentRule.run({ html, url: 'https://example.test/', doc: new DOMParser().parseFromString(html, 'text/html') }, { globals: {} })
  expect(result.presentation?.values).toEqual([
    { key: 'Types', value: 'NewsArticle', kind: 'text' }, { key: 'NewsArticle', value: 'Only story', kind: 'text' },
    { key: LABEL, value: html, kind: 'original', fidelity: 'complete-original' },
  ])
})
