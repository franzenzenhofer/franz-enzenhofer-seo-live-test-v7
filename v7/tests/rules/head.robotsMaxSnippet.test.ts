import { describe, expect, it } from 'vitest'

import { robotsMaxSnippetRule as rule } from '@/rules/head/robotsMaxSnippet'
import { enrichResult } from '@/core/runHelpers'
import { toResultCopyPayload } from '@/components/result/resultCopy'

const doc = (h: string) => new DOMParser().parseFromString(h, 'text/html')
const run = async (html: string, headers?: Record<string, string>) => enrichResult(
  await rule.run({ html, url: 'https://ex.com', doc: doc(html), headers }, { globals: {} }), rule, 'test',
)

describe('head: robots max-snippet', () => {
  it('reports info when directive is missing and headers were not captured', async () => {
    const r = await run('<head></head>')
    expect(r.type).toBe('info')
    expect(r.priority).toBe(700)
    expect(r.presentation?.input).toBe('Static DOM')
    expect(r.presentation?.values).toContainEqual({ key: 'max-snippet directives', value: 0, kind: 'text' })
  })

  it('reports info for a valid numeric value and retains original markup', async () => {
    const html = '<meta name="robots" content="max-snippet:50">'
    const r = await run(html, {})
    expect(r.type).toBe('info')
    expect(r.priority).toBe(700)
    expect(r.presentation?.input).toBe('Static DOM + HTTP response headers')
    expect(r.presentation?.markup[0]?.value).toBe(html)
    expect(r.presentation?.evidence[0]?.fields).toContainEqual({ key: 'Value', value: '50', kind: 'text' })
  })

  it('warns on invalid values naming the crawler and source', async () => {
    const r = await run('<meta name="googlebot" content="max-snippet:foo">')
    expect(r.type).toBe('warn')
    expect(r.priority).toBe(240)
    expect(r.presentation?.values).toContainEqual({ key: 'Invalid values', value: 1, kind: 'text' })
    expect(r.presentation?.evidence[0]?.fields).toContainEqual({ key: 'Crawler', value: 'googlebot', kind: 'text' })
  })

  it('preserves the documentation reference and userGuide, and removes the legacy details payload', async () => {
    const r = await run('<meta name="robots" content="max-snippet:10">')
    expect(r.presentation?.references).toEqual(rule.meta.references)
    expect(rule.meta.userGuide?.check).toContain('max-snippet')
    expect(r.details).toBeUndefined()
    expect(toResultCopyPayload(r)).not.toContain('[object Object]')
  })
})
