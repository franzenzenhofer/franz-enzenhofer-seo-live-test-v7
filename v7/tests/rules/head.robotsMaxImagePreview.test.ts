import { describe, expect, it } from 'vitest'

import { robotsMaxImagePreviewRule as rule } from '@/rules/head/robotsMaxImagePreview'
import { enrichResult } from '@/core/runHelpers'
import { toResultCopyPayload } from '@/components/result/resultCopy'

const doc = (h: string) => new DOMParser().parseFromString(h, 'text/html')
const run = async (html: string, headers?: Record<string, string>) => enrichResult(
  await rule.run({ html, url: 'https://ex.com', doc: doc(html), headers }, { globals: {} }), rule, 'test',
)

describe('head: robots max-image-preview', () => {
  it('reports info when directive is missing and headers were not captured', async () => {
    const r = await run('<head></head>')
    expect(r.type).toBe('info')
    expect(r.priority).toBe(905)
    expect(r.presentation?.input).toBe('Static DOM')
    expect(r.presentation?.checked).toContainEqual({ key: 'Header', value: 'Not captured', kind: 'text' })
    expect(r.presentation?.values).toEqual([{ key: 'max-image-preview', value: 'Not found', kind: 'text' }])
  })

  it('reports info for a valid value and retains its original markup', async () => {
    const html = '<meta name="robots" content="max-image-preview:standard">'
    const r = await run(html, {})
    expect(r.type).toBe('info')
    expect(r.priority).toBe(700)
    expect(r.presentation?.input).toBe('Static DOM + HTTP response headers')
    expect(r.presentation?.markup[0]?.value).toBe(html)
    expect(r.presentation?.values).toContainEqual({ key: 'max-image-preview', value: 'standard', kind: 'text' })
    expect(r.presentation?.values).toContainEqual({ key: 'Applies to', value: 'all crawlers', kind: 'text' })
    expect(r.presentation?.values).toContainEqual({ key: '<meta name="robots">', value: html, kind: 'original', fidelity: 'complete-original' })
    expect(r.presentation?.evidence[0]?.fields).toContainEqual({ key: 'Syntax', value: 'Valid', kind: 'text' })
  })

  it('warns on an invalid value naming the offending crawler', async () => {
    const html = '<meta name="googlebot" content="max-image-preview:giant">'
    const r = await run(html)
    expect(r.type).toBe('warn')
    expect(r.priority).toBe(240)
    expect(r.presentation?.values).toContainEqual({ key: 'Invalid values', value: '1 of 1', kind: 'text' })
    expect(r.presentation?.values).toContainEqual({ key: 'Applies to', value: 'googlebot', kind: 'text' })
    expect(r.presentation?.evidence[0]?.fields).toContainEqual({ key: 'Crawler', value: 'googlebot', kind: 'text' })
    expect(r.presentation?.evidence[0]?.fields).toContainEqual({ key: 'Syntax', value: 'Invalid', kind: 'text' })
  })

  it('reports a header-sourced directive without markup', async () => {
    const r = await run('<head></head>', { 'X-Robots-Tag': 'max-image-preview:large' })
    expect(r.type).toBe('info')
    expect(r.presentation?.values).toContainEqual({ key: 'max-image-preview', value: 'large', kind: 'text' })
    expect(r.presentation?.detailValues).toEqual([{ key: 'X-Robots-Tag', value: 'max-image-preview:large', kind: 'text' }])
    expect(r.presentation?.evidence).toHaveLength(0)
    expect(r.presentation?.markup).toHaveLength(0)
    expect(r.presentation?.noMarkup).toBe('No matching max-image-preview element found')
  })

  it('preserves the documentation reference and removes the legacy details payload', async () => {
    const r = await run('<meta name="robots" content="max-image-preview:large">')
    expect(r.presentation?.references).toEqual(rule.meta.references)
    expect(r.details).toBeUndefined()
    expect(toResultCopyPayload(r)).not.toContain('[object Object]')
  })
})
