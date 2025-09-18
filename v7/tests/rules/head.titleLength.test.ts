import { describe, it, expect } from 'vitest'
import { titleLengthRule } from '@/rules/head/titleLength'

const doc = (h: string) => new DOMParser().parseFromString(h, 'text/html')

describe('rule: title length', () => {
  it('flags short titles', async () => {
    const r = await titleLengthRule.run({ html:'', url:'', doc: doc('<title>x</title>') }, { globals: {} })
    expect((r as any).type).toBe('warn')
  })
  it('accepts good titles', async () => {
    const r = await titleLengthRule.run({ html:'', url:'', doc: doc('<title>0123456789 ok</title>') }, { globals: {} })
    expect((r as any).type).toBe('ok')
  })
})

