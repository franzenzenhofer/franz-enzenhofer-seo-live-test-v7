import { describe, it, expect } from 'vitest'
import { googleIsConnectedRule } from '@/rules/google/isConnected'

describe('rule: google is connected', () => {
  it('ok when token present', async () => {
    const r = await googleIsConnectedRule.run({} as any, { globals: { googleApiAccessToken: 't' } })
    expect((r as any).type).toBe('ok')
  })
})

