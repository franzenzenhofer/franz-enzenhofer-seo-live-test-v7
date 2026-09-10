import { describe, expect, it } from 'vitest'

import { metaCharsetRule as rule } from '@/rules/head/metaCharset'

const run = (html: string, headers?: Record<string, string>) => rule.run({
  html, url: 'https://example.test/', doc: new DOMParser().parseFromString(html, 'text/html'), headers,
}, { globals: {} })

describe('meta charset', () => {
  it('accepts UTF-8 meta charset and retains complete original markup', async () => {
    const html = '<meta charset="utf-8" data-source="template">'
    const r = await run(html)

    expect(r.type).toBe('ok')
    expect(r.priority).toBe(800)
    expect(r.presentation?.input).toBe('Static DOM')
    expect(r.presentation?.values).toContainEqual({ key: 'Charset', value: 'UTF-8', kind: 'text' })
    expect(r.presentation?.markup[0].value).toBe(html)
  })

  it('warns for non-UTF-8 and preserves the normalized value', async () => {
    const r = await run('<meta charset="ISO-8859-1">')

    expect(r.type).toBe('warn')
    expect(r.priority).toBe(200)
    expect(r.message).toContain('ISO-8859-1')
    expect(r.presentation?.values).toContainEqual({ key: 'UTF-8 conformance', value: 'Not UTF-8', kind: 'text' })
  })

  it('warns for an empty meta charset declaration', async () => {
    const r = await run('<meta charset="">')

    expect(r.type).toBe('warn')
    expect(r.priority).toBe(150)
    expect(r.presentation?.values).toContainEqual({ key: 'Charset', value: 'Empty', kind: 'text' })
    expect(r.presentation?.markup).toHaveLength(1)
  })

  it('uses an UTF-8 http-equiv declaration when meta charset is absent', async () => {
    const html = '<meta http-equiv="Content-Type" content="text/html; charset=utf-8" data-source="template">'
    const r = await run(html)

    expect(r.type).toBe('ok')
    expect(r.presentation?.values).toContainEqual({ key: 'Declaration source', value: 'Meta http-equiv Content-Type', kind: 'text' })
    expect(r.presentation?.markup[0].value).toBe(html)
  })

  it('uses the Content-Type header when no encoding element declares a charset', async () => {
    const r = await run('<p>Text</p>', { 'content-type': 'text/html; charset=UTF-8' })

    expect(r.type).toBe('ok')
    expect(r.priority).toBe(800)
    expect(r.presentation?.input).toBe('Static DOM + HTTP response headers')
    expect(r.presentation?.values).toContainEqual({ key: 'Declaration source', value: 'Content-Type header', kind: 'text' })
    expect(r.presentation?.evidence[0].fields).toContainEqual({ key: 'Content-Type header', value: 'text/html; charset=UTF-8', kind: 'text' })
    expect(r.presentation?.markup).toEqual([])
  })

  it('keeps an empty meta declaration ahead of a valid response header', async () => {
    const r = await run('<meta charset="">', { 'content-type': 'text/html; charset=UTF-8' })

    expect(r.type).toBe('warn')
    expect(r.priority).toBe(150)
    expect(r.presentation?.values).toContainEqual({ key: 'Declaration source', value: '<meta charset>', kind: 'text' })
  })

  it('warns when no declaration exists and preserves the reference without legacy details', async () => {
    const r = await run('<p>Text</p>')

    expect(r.type).toBe('warn')
    expect(r.priority).toBe(100)
    expect(r.presentation?.noMarkup).toBe('No character encoding element found')
    expect(r.presentation?.references).toEqual(rule.meta.references)
    expect(r.details).toBeUndefined()
  })
})

it('retains a checked http-equiv element whose content contains no charset', async () => {
  const html = '<meta http-equiv="Content-Type" data-source="cms" content="text/html">'
  const result = await run(html)
  expect(result.type).toBe('warn')
  expect(result.priority).toBe(100)
  expect(result.presentation?.markup[0]?.value).toBe(html)
})
