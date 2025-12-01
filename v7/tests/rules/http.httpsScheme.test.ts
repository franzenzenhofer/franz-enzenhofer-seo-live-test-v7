import { describe, it, expect } from 'vitest'
import { httpsSchemeRule } from '@/rules/http/httpsScheme'

const P = (url: string, headers: Record<string, string> = { 'content-type': 'text/html' }) =>
  ({ html:'', url, doc: new DOMParser().parseFromString('<p/>','text/html'), headers })

describe('rule: https scheme', () => {
  it('returns runtime_error when headers not captured', async () => {
    const r = await httpsSchemeRule.run(P('https://ex.com', {}) as any, { globals: {} })
    expect((r as any).type).toBe('runtime_error')
    expect((r as any).message).toContain('Hard Reload')
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

