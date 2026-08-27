import { describe, expect, it } from 'vitest'

import { registry } from '@/rules/registry'

describe('rule input contract', () => {
  it('assigns an explicit input to every registered rule', () => {
    const missing = registry.filter((rule) => !rule.input).map((rule) => rule.id)
    expect(missing).toEqual([])
  })

  it('uses only supported input phases', () => {
    const supported = new Set(['static', 'idle', 'compare', 'context'])
    expect(registry.every((rule) => supported.has(String(rule.input)))).toBe(true)
  })

  it('matches the authoritative static, idle, and compare families', () => {
    const input = (id: string) => registry.find((rule) => rule.id === id)?.input
    expect(input('body:h1')).toBe('static')
    expect(input('body:internal-links')).toBe('static')
    expect(input('speed:blocking-scripts')).toBe('static')
    expect(input('head:meta-viewport')).toBe('idle')
    expect(input('body:nofollow')).toBe('idle')
    expect(input('dom:node-count')).toBe('idle')
    expect(input('dom:client-side-rendering')).toBe('compare')
    expect(input('dom:parameterized-links-diff')).toBe('compare')
  })
})
