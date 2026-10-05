import { describe, expect, it } from 'vitest'

import { pageObjectRule } from '@/rules/debug/pageObject'

describe('rule: debug page object', () => {
  it('returns info with a labelled snapshot of the page object', async () => {
    const p = { html: '', url: 'https://ex.com', doc: new DOMParser().parseFromString('<p/>', 'text/html'), status: 200, headers: { Status: '200' } }
    const r = await pageObjectRule.run(p as any, { globals: {} })
    expect(r.type).toBe('info')
    expect(r.priority).toBe(900)
    const values = Object.fromEntries(r.presentation!.values.map((f) => [f.key, f.value]))
    expect(r.presentation!.values[0]).toEqual({ key: 'Current page URL', value: 'https://ex.com', kind: 'url' })
    expect(values['Response status']).toContain('200')
    expect(values['Header count']).toBe(1)
  })

  it('reports cache state factually when unknown', async () => {
    const p = { html: '', url: 'https://ex.com', doc: new DOMParser().parseFromString('<p/>', 'text/html') }
    const r = await pageObjectRule.run(p as any, { globals: {} })
    const values = Object.fromEntries(r.presentation!.values.map((f) => [f.key, f.value]))
    expect(values['Served from']).toBe('Not captured')
  })

  it('names the delivery source as a fact, never as Yes/No', async () => {
    const p = { html: '', url: 'https://ex.com', doc: new DOMParser().parseFromString('<p/>', 'text/html'), fromCache: true }
    const r = await pageObjectRule.run(p as any, { globals: {} })
    const values = Object.fromEntries(r.presentation!.values.map((f) => [f.key, f.value]))
    expect(values['Served from']).toBe('Cache')
  })

  it('never surfaces legacy details', async () => {
    const p = { html: '', url: 'https://ex.com', doc: new DOMParser().parseFromString('<p/>', 'text/html') }
    const r = await pageObjectRule.run(p as any, { globals: {} })
    expect((r as any).details).toBeUndefined()
  })
})
