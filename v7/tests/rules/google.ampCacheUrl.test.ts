import { describe, it, expect } from 'vitest'
import { ampCacheUrlRule } from '@/rules/google/ampCacheUrl'
import { toResultCopyPayload } from '@/components/result/resultCopy'

const D = (h: string) => new DOMParser().parseFromString(h, 'text/html')
const value = (r: Awaited<ReturnType<typeof ampCacheUrlRule.run>>, key: string) => r.presentation?.values.find((field) => field.key === key)?.value
const detail = (r: Awaited<ReturnType<typeof ampCacheUrlRule.run>>, key: string) => r.presentation?.detailValues.find((field) => field.key === key)

describe('rule: amp cache url', () => {
  it('derives the publisher-subdomain cache url and keeps the query string', async () => {
    const doc = D('<link rel="amphtml" href="https://my-pub.com/article.amp.html?id=7">')
    const r = await ampCacheUrlRule.run({ html: '', url: 'https://my-pub.com', doc }, { globals: {} })
    expect(r.type).toBe('info'); expect(r.priority).toBe(700)
    expect(r.presentation?.input).toBe('Idle DOM'); expect(r.label).toBe('HEAD')
    expect(value(r, 'AMP Cache URL')).toBe('Derived')
    expect(detail(r, 'Declared amphtml href')).toEqual({ key: 'Declared amphtml href', value: 'https://my-pub.com/article.amp.html?id=7', kind: 'url' })
    expect(r.presentation?.values).toContainEqual({ key: 'Cache URL', value: 'https://0-my--pub-com-0.cdn.ampproject.org/c/s/my-pub.com/article.amp.html?id=7', kind: 'url' })
    expect(r.details).toBeUndefined()
  })

  it('omits the /s/ infix for http amp pages', async () => {
    const doc = D('<link rel="amphtml" href="http://pub.com/amp">')
    const r = await ampCacheUrlRule.run({ html: '', url: 'http://pub.com', doc }, { globals: {} })
    expect(r.presentation?.values).toContainEqual({ key: 'Cache URL', value: 'https://pub-com.cdn.ampproject.org/c/pub.com/amp', kind: 'url' })
  })

  it('defers presence to head:amphtml when no amphtml link exists', async () => {
    const r = await ampCacheUrlRule.run({ html: '', url: 'https://ex.com', doc: D('<p>x</p>') }, { globals: {} })
    expect(r.type).toBe('info'); expect(r.priority).toBe(950)
    expect(value(r, 'AMP Cache URL')).toBe('Not applicable - no amphtml link')
    expect(r.presentation?.noMarkup).toBe('No matching amphtml link found')
  })

  it('reports a hostname that cannot be calculated (port present) without claiming it is invalid', async () => {
    const doc = D('<link rel="amphtml" href="https://example.com:8080/amp">')
    const r = await ampCacheUrlRule.run({ html: '', url: 'https://example.com:8080', doc }, { globals: {} })
    expect(r.type).toBe('info'); expect(r.priority).toBe(400)
    expect(value(r, 'AMP Cache URL')).toBe('Not calculable for this hostname or port')
  })

  it('warns and uses a plain text field for a declared href that fails resolution', async () => {
    const doc = D('<link rel="amphtml" href="javascript:alert(1)">')
    const r = await ampCacheUrlRule.run({ html: '', url: 'https://ex.com', doc }, { globals: {} })
    expect(r.type).toBe('warn'); expect(r.priority).toBe(400)
    expect(value(r, 'AMP Cache URL')).toBe('Not applicable - amphtml href is not a valid HTTP(S) URL')
    expect(detail(r, 'Declared amphtml href')).toEqual({ key: 'Declared amphtml href', value: 'javascript:alert(1)', kind: 'text' })
  })

  it('resolves relative AMP declarations and handles the reserved double-dash prefix', async () => {
    const doc = D('<link rel="AMPHTML" href="/amp">')
    const r = await ampCacheUrlRule.run({ html: '', url: 'https://en-us.example.com/page', doc }, { globals: {} })
    expect(r.presentation?.values).toContainEqual({ key: 'Cache URL', value: 'https://0-en--us-example-com-0.cdn.ampproject.org/c/s/en-us.example.com/amp', kind: 'url' })
    expect(toResultCopyPayload(r)).toContain('https://amp.dev/documentation/guides-and-tutorials/learn/amp-caches-and-cors/amp-cache-urls/')
  })

  it('retains the checked base[href] markup when it is read to resolve a relative AMP declaration', async () => {
    const html = '<base href="https://example.com/news/"><link rel="amphtml" href="amp.html">'
    const r = await ampCacheUrlRule.run({ html, url: 'https://example.com/page', doc: D(html) }, { globals: {} })
    expect(detail(r, 'Base href')).toEqual({ key: 'Base href', value: 'https://example.com/news/', kind: 'url' })
    expect(r.presentation?.markup.some((field) => field.value === '<base href="https://example.com/news/">')).toBe(true)
  })

  it('does not claim to have read an empty base[href]', async () => {
    const html = '<base href=""><link rel="amphtml" href="/amp">'
    const r = await ampCacheUrlRule.run({ html, url: 'https://example.com/page', doc: D(html) }, { globals: {} })
    expect(detail(r, 'Base href')).toEqual({ key: 'Base href', value: 'Not declared', kind: 'text' })
    expect(r.presentation?.markup.some((field) => field.value.startsWith('<base'))).toBe(false)
  })
})
