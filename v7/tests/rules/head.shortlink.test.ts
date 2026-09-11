import { describe, it, expect } from 'vitest'
import { shortlinkRule } from '@/rules/head/shortlink'
import { toResultCopyPayload } from '@/components/result/resultCopy'

const doc = (h: string) => new DOMParser().parseFromString(h, 'text/html')

describe('rule: shortlink', () => {
  it('reports a valid alternate shortlink without calling it a defect', async () => {
    const r = await shortlinkRule.run({ html: '', url: 'https://example.com/page', doc: doc('<link rel="shortlink" href="/s"/>') }, { globals: {} })
    expect(r.type).toBe('info')
    expect(r.priority).toBe(850)
    expect(r.presentation?.input).toBe('Static DOM')
    expect(r.presentation?.values).toContainEqual({ key: 'Resolved URL', value: 'https://example.com/s', kind: 'url' })
    expect(r.presentation?.markup[0]?.value).toBe('<link rel="shortlink" href="/s">')
    expect(r.label).toBe('HEAD')
  })

  it('warns when present without href', async () => {
    const r = await shortlinkRule.run({ html: '', url: 'https://example.com/page', doc: doc('<link rel="shortlink">') }, { globals: {} })
    expect(r.type).toBe('warn')
    expect(r.priority).toBe(400)
    expect(r.presentation?.values).toContainEqual({ key: 'Declared href', value: 'Empty', kind: 'text' })
    expect(r.presentation?.markup[0]?.value).toBe('<link rel="shortlink">')
  })

  it('treats missing shortlink as ok/info', async () => {
    const r = await shortlinkRule.run({ html: '', url: 'https://example.com/page', doc: doc('<head></head>') }, { globals: {} })
    expect(r.type).toBe('info')
    expect(r.priority).toBe(950)
    expect(r.presentation?.values).toContainEqual({ key: 'Shortlink', value: 'Not found', kind: 'text' })
    expect(r.presentation?.noMarkup).toBe('No matching shortlink element found')
    expect(r.presentation?.checked).toContainEqual({ key: 'Selection', value: 'First match', kind: 'text' })
  })

  it('reports an invalid shortlink as a named finding instead of throwing', async () => {
    const result = await shortlinkRule.run({ html: '', url: 'https://example.test/', doc: doc('<link rel="shortlink" href="http://[">') }, { globals: {} })
    expect(result.type).toBe('warn')
    expect(result.priority).toBe(500)
    expect(result.presentation?.values).toContainEqual({ key: 'Declared href', value: 'http://[', kind: 'text' })
    expect(result.presentation?.values).toContainEqual({ key: 'Resolved URL', value: 'Invalid HTTP(S) URL', kind: 'text' })
    expect(toResultCopyPayload(result)).toContain('https://developer.wordpress.org/reference/functions/wp_get_shortlink/')
    expect(result.details).toBeUndefined()
  })

  it('retains the checked base[href] markup when it is read to resolve a relative shortlink', async () => {
    const html = '<base href="https://example.com/sub/"><link rel="shortlink" href="s">'
    const result = await shortlinkRule.run({ html, url: 'https://example.com/page', doc: doc(html) }, { globals: {} })
    expect(result.presentation?.values).toContainEqual({ key: 'Resolved URL', value: 'https://example.com/sub/s', kind: 'url' })
    expect(result.presentation?.detailValues).toContainEqual({ key: 'Base href', value: 'https://example.com/sub/', kind: 'url' })
    expect(result.presentation?.markup.some((field) => field.value === '<base href="https://example.com/sub/">')).toBe(true)
  })

  it('does not claim to have read an empty base[href]', async () => {
    const html = '<base href=""><link rel="shortlink" href="/s">'
    const result = await shortlinkRule.run({ html, url: 'https://example.com/page', doc: doc(html) }, { globals: {} })
    expect(result.presentation?.detailValues).toContainEqual({ key: 'Base href', value: 'Not declared', kind: 'text' })
    expect(result.presentation?.markup.some((field) => field.value.startsWith('<base'))).toBe(false)
  })
})
