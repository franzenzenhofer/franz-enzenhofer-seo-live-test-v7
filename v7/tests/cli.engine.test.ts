import { describe, it, expect } from 'vitest'

import { runAllCli } from '@/cli/runner'

const html = '<!doctype html><head><title>Hi</title><meta name="description" content="World"></head><div>ok</div>'

describe('cli engine', () => {
  it('produces results from rules', async () => {
    const out = await runAllCli([], { events: [], html })
    const labels = (out as Array<{ label: string }> ).map((r)=> r.label)
    expect(labels).toContain('HEAD')
  })
})

