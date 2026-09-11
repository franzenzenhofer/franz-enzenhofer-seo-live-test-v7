import { describe, it, expect } from 'vitest'
import { amphtmlRule } from '@/rules/head/amphtml'
import { toResultCopyPayload } from '@/components/result/resultCopy'

const doc = (h: string) => new DOMParser().parseFromString(h, 'text/html')

describe('rule: amphtml link', () => {
  it('reports a valid AMP destination as information', async () => {
    const r = await amphtmlRule.run({ html: '', url: 'https://example.test/page', doc: doc('<link rel="amphtml" href="/amp"/>') }, { globals: {} })
    expect(r.type).toBe('info')
    expect(r.priority).toBe(500)
    expect(r.presentation?.input).toBe('Static DOM')
    expect(r.presentation?.values).toContainEqual({ key: 'Resolved AMP URL', value: 'https://example.test/amp', kind: 'url' })
    expect(r.presentation?.markup[0]?.value).toBe('<link rel="amphtml" href="/amp">')
    expect(r.label).toBe('HEAD')
  })

  it('notes absence as info', async () => {
    const r = await amphtmlRule.run({ html: '', url: 'https://example.test/page', doc: doc('<head></head>') }, { globals: {} })
    expect(r.type).toBe('info')
    expect(r.priority).toBe(950)
    expect(r.presentation?.values).toContainEqual({ key: 'AMP HTML link', value: 'Not found', kind: 'text' })
    expect(r.presentation?.noMarkup).toBe('No matching amphtml link found')
    expect(r.presentation?.checked).toContainEqual({ key: 'Selection', value: 'First match', kind: 'text' })
  })

  it('reports an empty or invalid href as a warning with complete markup', async () => {
    for (const html of ['<link rel="amphtml">', '<link rel="amphtml" href="javascript:alert(1)">']) {
      const result = await amphtmlRule.run({ html: '', url: 'https://example.test/page', doc: doc(html) }, { globals: {} })
      expect(result.type).toBe('warn')
      expect(result.priority).toBe(500)
      expect(result.presentation?.markup[0]?.value).toBe(html)
      expect(result.presentation?.detailValues).toContainEqual({ key: 'Validator URL', value: 'Not generated', kind: 'text' })
    }
  })
})

it('resolves the document base and safely encodes the validator destination', async () => {
  const result = await amphtmlRule.run({ html: '', url: 'https://example.test/page', doc: doc('<base href="/news/"><link rel="amphtml" href="story?x=1&amp;y=2">') }, { globals: {} })
  expect(result.presentation?.values).toContainEqual({ key: 'Resolved AMP URL', value: 'https://example.test/news/story?x=1&y=2', kind: 'url' })
  expect(result.presentation?.detailValues.find((field) => field.key === 'Validator URL')?.value).toContain(encodeURIComponent('https://example.test/news/story?x=1&y=2'))
  expect(result.presentation?.detailValues).toContainEqual({ key: 'Base href', value: '/news/', kind: 'url' })
  expect(result.presentation?.markup.some((field) => field.value === '<base href="/news/">')).toBe(true)
  expect(toResultCopyPayload(result)).toContain('https://amp.dev/documentation/guides-and-tutorials/optimize-and-measure/discovery/')
  expect(result.details).toBeUndefined()
})

it('does not claim to have read an empty base[href]', async () => {
  const html = '<base href=""><link rel="amphtml" href="/amp">'
  const result = await amphtmlRule.run({ html, url: 'https://example.test/page', doc: doc(html) }, { globals: {} })
  expect(result.presentation?.detailValues).toContainEqual({ key: 'Base href', value: 'Not declared', kind: 'text' })
  expect(result.presentation?.markup.some((field) => field.value.startsWith('<base'))).toBe(false)
})
