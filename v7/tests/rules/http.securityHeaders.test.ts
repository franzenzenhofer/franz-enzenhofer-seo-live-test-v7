import { describe, it, expect } from 'vitest'
import { securityHeadersRule } from '@/rules/http/securityHeaders'

const P = (h: Record<string,string>) => ({ html:'', url:'', doc: new DOMParser().parseFromString('<p/>','text/html'), headers: h })

describe('rule: security headers', () => {
  it('returns runtime_error when headers not captured', async () => {
    const r = await securityHeadersRule.run(P({}), { globals: {} })
    expect((r as any).type).toBe('runtime_error')
    expect((r as any).message).toContain('Hard Reload')
  })
  it('warns when headers missing', async () => {
    const r = await securityHeadersRule.run(P({ 'content-type': 'text/html' }), { globals: {} })
    expect((r as any).message.includes('Missing')).toBe(true)
  })
})

