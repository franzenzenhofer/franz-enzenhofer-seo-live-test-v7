import { describe, expect, it } from 'vitest'

import { parameterizedLinksDiffRule } from '@/rules/dom/parameterizedLinksDiff'

const D = (h: string) => new DOMParser().parseFromString(h, 'text/html')

describe('rule: parameterized links diff', () => {
  it('warns when static and idle differ', async () => {
    const p = {
      html: '',
      url: 'https://ex.com/page',
      doc: D('<a href="/a?x=1">a</a>'),
      domIdleDoc: D('<a href="/b?y=1">b</a>'),
    }
    const r = await parameterizedLinksDiffRule.run(p as any, { globals: {} })
    expect(r.type).toBe('warn')
  })
})
