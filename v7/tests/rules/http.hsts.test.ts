import { describe, it, expect } from 'vitest'
import { hstsRule } from '@/rules/http/hsts'

const P = (h: Record<string,string>) => ({ html:'', url:'', doc: new DOMParser().parseFromString('<p/>','text/html'), headers: h })

describe('rule: http hsts', () => {
  it('returns runtime_error when headers not captured', async () => {
    const r = await hstsRule.run(P({}), { globals: {} })
    expect((r as any).type).toBe('runtime_error')
    expect((r as any).message).toContain('Hard Reload')
  })
  it('warns on missing HSTS', async () => {
    const r = await hstsRule.run(P({ 'content-type': 'text/html' }), { globals: {} })
    expect((r as any).type).toBe('warn')
  })
  it('ok on present', async () => {
    const r = await hstsRule.run(P({ 'strict-transport-security': 'max-age=31536000' }), { globals: {} })
    expect((r as any).type).toBe('ok')
  })
})

