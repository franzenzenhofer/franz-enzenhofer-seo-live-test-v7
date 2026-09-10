import { expect, it } from 'vitest'

import { discoverPrimaryLanguageRule } from '@/rules/discover/primaryLanguage'

const run = (html: string) => discoverPrimaryLanguageRule.run({ html, doc: new DOMParser().parseFromString(html, 'text/html'), url: 'https://example.test' }, { globals: {} })
it('keeps language presence informational and displays normalized language separately from complete markup', async () => {
  const html = '<html lang=" en " data-site="travel"><head><title>Title</title></head><body><h1>Tour</h1></body></html>'
  const result = await run(html)
  expect(result.type).toBe('info')
  expect(result.priority).toBe(800)
  expect(result.presentation?.input).toBe('Idle DOM')
  expect(result.presentation?.values).toContainEqual(expect.objectContaining({ key: 'Language (trimmed)', value: 'en', kind: 'text' }))
  expect(result.presentation?.markup[0]?.value).toBe(html)
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
it('keeps bounded reconstructed opening tags outside guaranteed-original form fields', async () => {
  const result = await run(`<html lang="de" data-large="${'x'.repeat(9000)}"><body>Text</body></html>`)
  expect(result.presentation?.markup).toHaveLength(0)
  expect(result.presentation?.detailValues).toContainEqual(expect.objectContaining({ key: 'Opening tag excerpt (reconstructed)', kind: 'text' }))
  expect(result.presentation?.noMarkup).toContain('not retained')
})
