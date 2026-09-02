import { describe, expect, it } from 'vitest'

import { robotsAgentConflictsRule } from '@/rules/head/robotsAgentConflicts'

const doc = (h: string) => new DOMParser().parseFromString(h, 'text/html')
const run = (html: string, headers?: Record<string, string>) =>
  robotsAgentConflictsRule.run({ html, url: 'https://ex.com', doc: doc(html), headers } as any, { globals: {} } as any)

describe('rule: robots agent conflicts', () => {
  it('warns on conflicting ua-specific directives', async () => {
    const res = await run('<meta name="robots" content="noindex"><meta name="googlebot" content="index">')
    expect(res.type).toBe('warn')
  })

  it('warns when an agent noindex opposes an explicit global index', async () => {
    const res = await run('<meta name="robots" content="index,follow"><meta name="googlebot" content="noindex">')
    expect(res.type).toBe('warn')
    expect((res.details as any).conflicts).toEqual([{ ua: 'googlebot', directive: 'ua noindex vs global index' }])
  })

  it('warns when an agent nofollow opposes an explicit global follow', async () => {
    const res = await run('<meta name="robots" content="index,follow"><meta name="googlebot" content="nofollow">')
    expect(res.type).toBe('warn')
    expect((res.details as any).conflicts).toEqual([{ ua: 'googlebot', directive: 'ua nofollow vs global follow' }])
  })

  it('warns when an agent follow opposes a global nofollow', async () => {
    const res = await run('<meta name="robots" content="nofollow"><meta name="googlebot" content="follow">')
    expect(res.type).toBe('warn')
    expect((res.details as any).conflicts).toEqual([{ ua: 'googlebot', directive: 'follow vs global nofollow' }])
  })

  it('treats additive agent directives as consistent (sum of negative rules)', async () => {
    const res = await run('<meta name="robots" content="noindex"><meta name="googlebot" content="nosnippet">')
    expect(res.type).toBe('ok')
    expect(res.message).toMatch(/consistent/)
  })

  it('info for unusual agents', async () => {
    const res = await run('<meta name="weirdbot" content="noindex">')
    expect(res.type).toBe('info')
    expect((res.details as any).unusualAgents).toContain('weirdbot')
  })

  it('ok when consistent', async () => {
    const res = await run('<meta name="robots" content="index,follow">')
    expect(res.type).toBe('ok')
  })
})
