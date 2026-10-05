import { expect, it } from 'vitest'

import { discoverPrimaryLanguageRule } from '@/rules/discover/primaryLanguage'

const run = (html: string) => discoverPrimaryLanguageRule.run({ html, doc: new DOMParser().parseFromString(html, 'text/html'), url: 'https://example.test' }, { globals: {} })
it('keeps language presence informational and displays normalized language separately from complete markup', async () => {
  const html = '<html lang=" en " data-site="travel"><head><title>Title</title></head><body><h1>Tour</h1></body></html>'
  const result = await run(html)
  expect(result.type).toBe('info')
  expect(result.priority).toBe(800)
  expect(result.presentation?.input).toBe('Idle DOM')
  expect(result.presentation?.values).toEqual([{ key: 'Language', value: 'en', kind: 'text' }])
  expect(result.presentation?.markup).toEqual([])
  expect(result.presentation?.evidence[0]?.name).toBe('<html>')
  expect(result.presentation?.evidence[0]?.fields[0]?.key).toBe('DOM path')
  expect(result.presentation?.detailValues).toContainEqual({ key: 'Evidence retained', value: 1, kind: 'text' })
})
it.each(['<html>', '<html lang="">', '<html lang="   ">'])('preserves missing and empty language warnings: %s', async (html) => {
  const result = await run(html)
  expect(result.type).toBe('warn')
  expect(result.priority).toBe(250)
  expect(result.presentation?.checked).toContainEqual(expect.objectContaining({ key: 'Language code validity', value: 'Not checked' }))
})
it('does not introduce language-code validation', async () => {
  const result = await run('<html lang="not a language code">')
  expect(result.type).toBe('info')
})
it('never ships the html element as original markup, whatever its size', async () => {
  const result = await run(`<html lang="de" data-large="${'x'.repeat(9000)}"><body>Text</body></html>`)
  expect(result.presentation?.markup).toHaveLength(0)
  expect(result.presentation?.noMarkup.startsWith('Not retained:')).toBe(true)
  expect(result.presentation?.values).toEqual([{ key: 'Language', value: 'de', kind: 'text' }])
})
it('distinguishes a missing lang attribute from an empty one', async () => {
  expect((await run('<html>')).presentation?.values).toEqual([{ key: 'Language', value: 'Not declared', kind: 'text' }])
  expect((await run('<html>')).presentation?.evidence).toEqual([])
  expect((await run('<html lang="  ">')).presentation?.values).toEqual([{ key: 'Language', value: 'Empty', kind: 'text' }])
})
