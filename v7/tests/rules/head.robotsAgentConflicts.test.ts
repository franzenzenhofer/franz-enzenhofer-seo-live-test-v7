import { describe, expect, it } from 'vitest'

import { robotsAgentConflictsRule as rule } from '@/rules/head/robotsAgentConflicts'
import { enrichResult } from '@/core/runHelpers'
import { toResultCopyPayload } from '@/components/result/resultCopy'

const doc = (h: string) => new DOMParser().parseFromString(h, 'text/html')
const run = async (html: string, headers?: Record<string, string>) => enrichResult(
  await rule.run({ html, url: 'https://ex.com', doc: doc(html), headers }, { globals: {} }), rule, 'test',
)

describe('rule: robots agent conflicts', () => {
  it('reports info with no directives found', async () => {
    const r = await run('<html><head></head></html>')
    expect(r.type).toBe('info')
    expect(r.priority).toBe(920)
    expect(r.presentation?.values).toEqual([{ key: 'Robots directives', value: 'Not found', kind: 'text' }])
    expect(r.presentation?.noMarkup).toBe('No robots directive found')
  })

  it('warns on conflicting ua-specific directives and names the crawler and conflict', async () => {
    const html = '<meta name="robots" content="index,follow"><meta name="googlebot" content="noindex">'
    const r = await run(html)
    expect(r.type).toBe('warn')
    expect(r.priority).toBe(180)
    expect(r.presentation?.values).toContainEqual({ key: 'Crawlers', value: 'all crawlers, googlebot', kind: 'text' })
    expect(r.presentation?.values).toContainEqual({ key: 'Conflicts', value: 'googlebot: ua noindex vs global index', kind: 'text' })
    expect(r.presentation?.values.filter(({ kind }) => kind === 'original').map(({ key }) => key)).toEqual(['<meta name="robots">', '<meta name="googlebot">'])
    expect(r.presentation?.evidence.map(({ name }) => name)).toEqual(['<meta name="robots">', '<meta name="googlebot">'])
    expect(r.presentation?.evidence[1]?.fields).toContainEqual({ key: 'Instruction', value: 'noindex', kind: 'text' })
    expect(r.presentation?.markup.map(({ value }) => value)).toContain(html.split('><')[0] + '>')
  })

  it('treats additive agent directives as consistent (sum of negative rules)', async () => {
    const r = await run('<meta name="robots" content="noindex"><meta name="googlebot" content="nosnippet">')
    expect(r.type).toBe('ok')
    expect(r.priority).toBe(850)
    expect(r.presentation?.values).toContainEqual({ key: 'Conflicts', value: 'None', kind: 'text' })
    expect(r.presentation?.values).toContainEqual({ key: 'Nonstandard agents', value: 'None', kind: 'text' })
  })

  it('reports info for unusual agents naming them individually', async () => {
    const r = await run('<meta name="weirdbot" content="noindex">')
    expect(r.type).toBe('info')
    expect(r.priority).toBe(800)
    expect(r.presentation?.values).toContainEqual({ key: 'Nonstandard agents', value: 'weirdbot', kind: 'text' })
  })

  it('reports the effective merged policy per crawler and includes header-sourced directives', async () => {
    const r = await run('<meta name="robots" content="index,follow">', { 'X-Robots-Tag': 'bingbot: noindex' })
    expect(r.presentation?.input).toBe('Static DOM + HTTP response headers')
    expect(r.presentation?.detailValues).toContainEqual({ key: 'X-Robots-Tag', value: 'bingbot: noindex', kind: 'text' })
    expect(r.presentation?.detailValues).toContainEqual({ key: 'Policy: googlebot', value: 'None', kind: 'text' })
    expect(r.presentation?.detailValues).toContainEqual({ key: 'Policy: bingbot', value: 'noindex', kind: 'text' })
    expect(r.presentation?.evidence).toHaveLength(1)
    const copy = toResultCopyPayload(r)
    expect(copy).toContain('bingbot')
    expect(copy).not.toContain('[object Object]')
  })

  it('preserves the documentation reference and removes the legacy details payload', async () => {
    const r = await run('<meta name="robots" content="index">')
    expect(r.presentation?.references).toEqual(rule.meta.references)
    expect(r.details).toBeUndefined()
  })
})
