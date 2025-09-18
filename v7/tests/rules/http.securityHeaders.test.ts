import { describe, it, expect } from 'vitest'
import { securityHeadersRule } from '@/rules/http/securityHeaders'

const P = (h: Record<string,string>) => ({ html:'', url:'', doc: new DOMParser().parseFromString('<p/>','text/html'), headers: h })

describe('rule: security headers', () => {
  it('warn missing', async () => {
    const r = await securityHeadersRule.run(P({}), { globals: {} })
    expect((r as any).message.includes('Missing')).toBe(true)
  })
})

