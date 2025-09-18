import { describe, it, expect } from 'vitest'
import { htmlLangRule } from '@/rules/dom/htmlLang'

const D = (h: string) => new DOMParser().parseFromString(h,'text/html')

describe('rule: html lang', () => {
  it('warns missing', async () => {
    const r = await htmlLangRule.run({ html:'', url:'', doc: D('<html><head></head><body></body></html>') } as any, { globals: {} })
    expect((r as any).type).toBe('warn')
  })
})

