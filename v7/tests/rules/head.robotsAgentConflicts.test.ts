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
