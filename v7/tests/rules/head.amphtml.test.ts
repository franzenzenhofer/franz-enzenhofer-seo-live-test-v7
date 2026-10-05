import { describe, it, expect } from 'vitest'
import { amphtmlRule } from '@/rules/head/amphtml'
import { toResultCopyPayload } from '@/components/result/resultCopy'

const doc = (h: string) => new DOMParser().parseFromString(h, 'text/html')

describe('rule: amphtml link', () => {
  it('reports a valid AMP destination as information with the raw href, the URL and the element', async () => {
    const r = await amphtmlRule.run({ html: '', url: 'https://example.test/page', doc: doc('<link rel="amphtml" href="/amp"/>') }, { globals: {} })
    expect(r.type).toBe('info')
    expect(r.priority).toBe(500)
    expect(r.presentation?.input).toBe('Static DOM')
    expect(r.presentation?.values).toEqual([
      { key: 'AMP href', value: '/amp', kind: 'text' },
      { key: 'AMP URL', value: 'https://example.test/amp', kind: 'url' },
      { key: '<link rel="amphtml">', value: '<link rel="amphtml" href="/amp">', kind: 'original', fidelity: 'complete-original' },
    ])
    expect(r.presentation?.evidence).toEqual([{ name: '<link rel="amphtml">', fields: [
      { key: 'href', value: '/amp', kind: 'url' }, { key: 'DOM path', value: expect.any(String), kind: 'path' },
    ] }])
    expect(r.presentation?.detailValues).toEqual(expect.arrayContaining([
      { key: 'Markup retained', value: 1, kind: 'text' }, { key: 'Evidence retained', value: 1, kind: 'text' },
    ]))
    expect(r.label).toBe('HEAD')
  })

  it('shows no raw href row when the href already is the absolute AMP URL', async () => {
    const r = await amphtmlRule.run({ html: '', url: 'https://example.test/page', doc: doc('<link rel="amphtml" href="https://example.test/amp">') }, { globals: {} })
    expect(r.presentation?.values.some(({ key }) => key === 'AMP href')).toBe(false)
    expect(r.presentation?.values[0]).toEqual({ key: 'AMP URL', value: 'https://example.test/amp', kind: 'url' })
  })

  it('notes absence as info', async () => {
    const r = await amphtmlRule.run({ html: '', url: 'https://example.test/page', doc: doc('<head></head>') }, { globals: {} })
    expect(r.type).toBe('info')
    expect(r.priority).toBe(950)
    expect(r.presentation?.values).toContainEqual({ key: 'AMP HTML link', value: 'Not found', kind: 'text' })
    expect(r.presentation?.noMarkup).toBe('No matching amphtml link found')
    expect(r.presentation?.checked).toContainEqual({ key: 'Selection', value: 'First match', kind: 'text' })
  })

  it('reports an empty or invalid href as a warning with complete markup and no validator link', async () => {
    for (const [html, href] of [['<link rel="amphtml">', 'Empty'], ['<link rel="amphtml" href="javascript:alert(1)">', 'javascript:alert(1)']]) {
      const result = await amphtmlRule.run({ html: '', url: 'https://example.test/page', doc: doc(html!) }, { globals: {} })
      expect(result.type).toBe('warn')
      expect(result.priority).toBe(500)
      expect(result.presentation?.values).toContainEqual({ key: 'AMP href', value: href, kind: 'text' })
      expect(result.presentation?.values).toContainEqual({ key: 'AMP URL', value: 'Invalid HTTP(S) URL', kind: 'text' })
      expect(result.presentation?.markup[0]?.value).toBe(html)
      expect(result.presentation?.detailValues.some((field) => field.key === 'Validator URL')).toBe(false)
    }
  })
})

it('resolves the document base, retains the base element and safely encodes the validator destination', async () => {
  const result = await amphtmlRule.run({ html: '', url: 'https://example.test/page', doc: doc('<base href="/news/"><link rel="amphtml" href="story?x=1&amp;y=2">') }, { globals: {} })
  expect(result.presentation?.values).toContainEqual({ key: 'AMP URL', value: 'https://example.test/news/story?x=1&y=2', kind: 'url' })
  expect(result.presentation?.detailValues.find((field) => field.key === 'Validator URL')?.value).toContain(encodeURIComponent('https://example.test/news/story?x=1&y=2'))
  expect(result.presentation?.values).toContainEqual({ key: '<base>', value: '<base href="/news/">', kind: 'original', fidelity: 'complete-original' })
  expect(result.presentation?.evidence.find((record) => record.name === '<base>')?.fields).toContainEqual({ key: 'href', value: '/news/', kind: 'url' })
  expect(toResultCopyPayload(result)).toContain('https://amp.dev/documentation/guides-and-tutorials/optimize-and-measure/discovery/')
  expect(result.details).toBeUndefined()
})

it('does not claim to have read an empty base[href]', async () => {
  const html = '<base href=""><link rel="amphtml" href="/amp">'
  const result = await amphtmlRule.run({ html, url: 'https://example.test/page', doc: doc(html) }, { globals: {} })
  expect(result.presentation?.markup.some((field) => field.value.startsWith('<base'))).toBe(false)
  expect(result.presentation?.evidence.some((record) => record.name === '<base>')).toBe(false)
})
