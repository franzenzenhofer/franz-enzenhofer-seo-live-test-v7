import { describe, expect, it } from 'vitest'

import { robotsOtherMetaRule as rule } from '@/rules/head/robotsOtherMeta'
import { enrichResult } from '@/core/runHelpers'
import { toResultCopyPayload } from '@/components/result/resultCopy'

const doc = (h: string) => new DOMParser().parseFromString(h, 'text/html')
const run = async (html: string, headers?: Record<string, string>) => enrichResult(
  await rule.run({ html, url: 'https://ex.com', doc: doc(html), headers }, { globals: {} }), rule, 'test',
)

describe('rule: other robots meta', () => {
  it('is info when none present', async () => {
    const r = await run('<html><head></head></html>')
    expect(r.type).toBe('info')
    expect(r.priority).toBe(910)
    expect(r.presentation?.values).toContainEqual({ key: 'Agent-specific robots meta tags', value: 0, kind: 'text' })
    expect(r.presentation?.noMarkup).toBe('No agent-specific robots meta element found')
  })

  it('excludes robots and googlebot named metas from the agent-specific listing', async () => {
    const r = await run('<meta name="robots" content="noindex"><meta name="googlebot" content="noindex">')
    expect(r.presentation?.values).toContainEqual({ key: 'Agent-specific robots meta tags', value: 0, kind: 'text' })
  })

  it('warns when an agent-specific tag contains noindex, preserving original markup', async () => {
    const html = '<meta name="bingbot" content="noindex">'
    const r = await run(html)
    expect(r.type).toBe('warn')
    expect(r.priority).toBe(170)
    expect(r.presentation?.values).toContainEqual({ key: 'Contains noindex', value: 'Yes', kind: 'text' })
    expect(r.presentation?.markup[0]?.value).toBe(html)
  })

  it('reports count and each crawler as a named evidence record, ignoring header-only directives', async () => {
    const r = await run(
      '<meta name="bingbot" content="index,follow"><meta name="slurp" content="index">',
      { 'X-Robots-Tag': 'duckduckbot: noindex' },
    )
    expect(r.type).toBe('info')
    expect(r.priority).toBe(620)
    expect(r.presentation?.values).toContainEqual({ key: 'Agent-specific robots meta tags', value: 2, kind: 'text' })
    expect(r.presentation?.evidence).toHaveLength(2)
    expect(r.presentation?.evidence[0]?.fields).toContainEqual({ key: 'Crawler', value: 'bingbot', kind: 'text' })
    const copy = toResultCopyPayload(r)
    expect(copy).not.toContain('duckduckbot')
  })

  it('preserves the documentation reference and removes the legacy details payload', async () => {
    const r = await run('<meta name="bingbot" content="index">')
    expect(r.presentation?.references).toEqual(rule.meta.references)
    expect(r.details).toBeUndefined()
  })
})
