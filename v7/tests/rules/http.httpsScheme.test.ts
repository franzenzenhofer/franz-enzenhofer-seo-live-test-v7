import { describe, it, expect } from 'vitest'
import { httpsSchemeRule } from '@/rules/http/httpsScheme'

const P = (url: string, headers: Record<string, string> = { 'content-type': 'text/html' }) =>
  ({ html:'', url, doc: new DOMParser().parseFromString('<p/>','text/html'), headers })

describe('rule: https scheme', () => {
  it('checks the URL even when response headers were not captured', async () => {
    const r = await httpsSchemeRule.run(P('https://ex.com', {}) as any, { globals: {} })
    expect((r as any).type).toBe('ok')
  })
  it('ok for https', async () => {
    const r = await httpsSchemeRule.run(P('https://ex.com') as any, { globals: {} })
    expect((r as any).type).toBe('ok')
  })
  it('warn for http', async () => {
    const r = await httpsSchemeRule.run(P('http://ex.com') as any, { globals: {} })
    expect((r as any).type).toBe('warn')
  })
})

