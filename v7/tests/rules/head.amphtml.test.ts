import { describe, it, expect } from 'vitest'
import { amphtmlRule } from '@/rules/head/amphtml'

const doc = (h: string) => new DOMParser().parseFromString(h, 'text/html')

describe('rule: amphtml link', () => {
  it('warns when present', async () => {
    const r = await amphtmlRule.run({ html:'', url:'', doc: doc('<link rel="amphtml" href="/amp"/>') }, { globals: {} })
    expect((r as any).type).toBe('warn')
  })

  it('notes absence as info', async () => {
    const r = await amphtmlRule.run({ html:'', url:'', doc: doc('<head></head>') }, { globals: {} })
    expect((r as any).type).toBe('info')
  })
})
