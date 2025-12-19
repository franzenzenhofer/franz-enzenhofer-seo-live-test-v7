import { describe, expect, it } from 'vitest'

import { robotsOtherMetaRule } from '@/rules/head/robotsOtherMeta'

const doc = (h: string) => new DOMParser().parseFromString(h, 'text/html')
const run = (html: string) => robotsOtherMetaRule.run({ html, url: 'https://ex.com', doc: doc(html) } as any, { globals: {} } as any)

describe('rule: other robots meta', () => {
  it('is info when none present', async () => {
    const res = await run('<html><head></head></html>')
    expect(res.type).toBe('info')
  })

  it('warns when agent-specific noindex', async () => {
    const res = await run('<meta name="bingbot" content="noindex">')
    expect(res.type).toBe('warn')
  })

  it('reports count', async () => {
    const res = await run('<meta name="bingbot" content="index,follow"><meta name="slurp" content="index">')
    expect(res.message).toContain('2 agent-specific')
  })
})
