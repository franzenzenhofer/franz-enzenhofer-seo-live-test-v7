import { describe, it, expect } from 'vitest'
import { gzipRule } from '@/rules/http/gzip'

const P = (h: Record<string,string>) => ({ html:'', url:'', doc: new DOMParser().parseFromString('<p/>','text/html'), headers: h })

describe('rule: http gzip', () => {
  it('warns on missing header', async () => {
    const r = await gzipRule.run(P({}), { globals: {} })
    expect((r as any).type).toBe('warn')
  })
  it('ok on br/gzip', async () => {
    const r = await gzipRule.run(P({ 'content-encoding': 'br' }), { globals: {} })
    expect((r as any).type).toBe('ok')
  })
})

