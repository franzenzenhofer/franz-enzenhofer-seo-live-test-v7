import { describe, it, expect } from 'vitest'
import { httpsSchemeRule } from '@/rules/http/httpsScheme'

describe('rule: https scheme', () => {
  it('ok for https', async () => {
    const r = await httpsSchemeRule.run({ html:'', url:'https://ex.com', doc: new DOMParser().parseFromString('<p/>','text/html') } as any, { globals: {} })
    expect((r as any).type).toBe('ok')
  })
  it('warn for http', async () => {
    const r = await httpsSchemeRule.run({ html:'', url:'http://ex.com', doc: new DOMParser().parseFromString('<p/>','text/html') } as any, { globals: {} })
    expect((r as any).type).toBe('warn')
  })
})

