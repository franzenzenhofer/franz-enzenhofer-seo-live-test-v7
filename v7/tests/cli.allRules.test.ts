import { describe, it, expect } from 'vitest'

import { runAllCli } from '@/cli/runner'
import { registry } from '@/rules/registry'

describe('CLI: all rules on simple page', () => {
  it('runs without throwing and yields results', async () => {
    // Stub network to avoid external I/O for PSI/GSC/etc.
    const mock = async () => new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } })
    // @ts-expect-error test stub
    globalThis.fetch = mock
    const url = 'https://example.local/'
    const html = '<!doctype html><meta charset="utf-8"><title>Example</title><link rel="canonical" href="https://example.local/"><meta name="robots" content="all">'
    const events = [
      { t: 'nav:before', u: url },
      { t: 'nav:commit', u: url },
      { t: 'dom:document_end', d: { html } },
      { t: 'dom:document_idle', d: { html } },
    ] as unknown as import('@/background/pipeline/types').EventRec[]
    const out = await runAllCli(registry, { events, html, globals: { variables: {}, events } } as any)
    expect(Array.isArray(out)).toBe(true)
    expect((out as any[]).length).toBeGreaterThan(0)
  }, 15000)
})
