import { describe, it, expect } from 'vitest'

import { headersPresentRule } from '@/rules/http/headersPresent'

const P = (headers?: Record<string, string>) =>
  ({ html: '', url: 'https://ex.com', doc: new DOMParser().parseFromString('<p/>', 'text/html'), headers })

describe('rule: headers present', () => {
  it('warns when headers missing', async () => {
    const r = await headersPresentRule.run(P({}) as any, { globals: {} })
    expect(r.type).toBe('warn')
  })

  it('reports info when headers exist', async () => {
    const r = await headersPresentRule.run(P({ Status: '200' }) as any, { globals: {} })
    expect(r.type).toBe('info')
  })
})
