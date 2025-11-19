import { describe, it, expect } from 'vitest'
import { hstsRule } from '@/rules/http/hsts'

const P = (h: Record<string,string>) => ({ html:'', url:'', doc: new DOMParser().parseFromString('<p/>','text/html'), headers: h })

describe('rule: http hsts', () => {
  it('warns on missing HSTS', async () => {
    const r = await hstsRule.run(P({}), { globals: {} })
    expect((r as any).type).toBe('warn')
  })
  it('info on present', async () => {
    const r = await hstsRule.run(P({ 'strict-transport-security': 'max-age=31536000' }), { globals: {} })
    expect((r as any).type).toBe('ok')
  })
})

