import { describe, expect, it } from 'vitest'

import { parseRobotsDirectives } from '@/shared/robots'
import { robotsMetaListRule } from '@/rules/head/robotsMetaList'
import { robotsOtherMetaRule } from '@/rules/head/robotsOtherMeta'
import { robotsAgentConflictsRule } from '@/rules/head/robotsAgentConflicts'

const doc = (h: string) => new DOMParser().parseFromString(h, 'text/html')
const page = (html: string, headers?: Record<string, string>) =>
  ({ html, url: 'https://ex.com', doc: doc(html), headers }) as never

// A realistic head: standard HTML metas that are NOT robots directives,
// plus one real robots meta. Before the fix, viewport/referrer/generator
// were all reported as "robots directives" - a false claim on every page.
const MIXED_HEAD = [
  '<meta name="viewport" content="width=device-width, initial-scale=1">',
  '<meta name="referrer" content="origin">',
  '<meta name="generator" content="MediaWiki 1.47.0-wmf.17">',
  '<meta name="application-name" content="news.ORF.at">',
  '<meta name="robots" content="max-image-preview:standard">',
].join('')

describe('robots meta directive classification (shared parser)', () => {
  it('does not classify standard HTML metas as robots directives', () => {
    const directives = parseRobotsDirectives(doc(MIXED_HEAD))
    const uas = directives.map((d) => d.ua)
    expect(uas).toEqual(['robots'])
  })

  it('still accepts agent-named robots metas by content', () => {
    const directives = parseRobotsDirectives(doc('<meta name="weirdbot" content="noindex, nofollow">'))
    expect(directives.map((d) => d.ua)).toEqual(['weirdbot'])
  })

  it('accepts known crawler UA names regardless of content', () => {
    const directives = parseRobotsDirectives(doc('<meta name="googlebot-news" content="noindex">'))
    expect(directives).toHaveLength(1)
  })

  it('does not flag noindex from free-text content of standard metas', () => {
    const html = '<meta name="description" content="how to use noindex, none and other directives">'
    const directives = parseRobotsDirectives(doc(html))
    expect(directives).toHaveLength(0)
  })
})

describe('head:robots-meta-list with mixed head', () => {
  it('counts only real robots metas', async () => {
    const res = await robotsMetaListRule.run(page(MIXED_HEAD), { globals: {} })
    expect(res.message).toContain('1 robots meta tag')
    expect(res.message).not.toContain('viewport')
    expect(res.message).not.toContain('generator')
  })
})

describe('head:meta-other-robots with mixed head', () => {
  it('reports no agent-specific robots metas when only standard metas exist', async () => {
    const res = await robotsOtherMetaRule.run(page(MIXED_HEAD), { globals: {} })
    expect(res.message).toMatch(/No agent-specific robots meta/)
    expect(res.type).toBe('info')
  })
})

describe('head:robots-agent-conflicts with mixed head', () => {
  it('does not claim agent-specific directives for standard metas', async () => {
    const res = await robotsAgentConflictsRule.run(page(MIXED_HEAD), { globals: {} })
    expect(res.type).toBe('ok')
    expect(res.message).not.toMatch(/review conflicts/)
  })

  it('names the conflicting agents in the message', async () => {
    const res = await robotsAgentConflictsRule.run(
      page('<meta name="robots" content="noindex"><meta name="googlebot" content="index">'),
      { globals: {} },
    )
    expect(res.type).toBe('warn')
    expect(res.message).toContain('googlebot')
  })

  it('names nonstandard agents in the message', async () => {
    const res = await robotsAgentConflictsRule.run(page('<meta name="weirdbot" content="noindex">'), { globals: {} })
    expect(res.type).toBe('info')
    expect(res.message).toContain('weirdbot')
  })
})
