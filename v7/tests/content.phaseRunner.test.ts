import { describe, expect, it, vi } from 'vitest'

import { runPhaseRules } from '@/content/phaseRunner'

import type { Rule } from '@/core/types'

const rule = (id: string, input: Rule['input']): Rule => ({
  id,
  input,
  name: id,
  enabled: true,
  run: vi.fn(async () => ({ name: id, label: id, message: id, type: 'ok' })),
})

describe('content phase runner', () => {
  it('executes only rules assigned to the current DOM phase', async () => {
    const staticRule = rule('static-rule', 'static')
    const idleRule = rule('idle-rule', 'idle')
    const contextRule = rule('context-rule', 'context')

    const results = await runPhaseRules({
      tabId: 1,
      phase: 'static',
      rules: [staticRule, idleRule, contextRule],
      page: { html: '', url: 'https://example.com/', doc: document },
      globals: {},
    })

    expect(results.map((result) => result.ruleId)).toEqual(['static-rule'])
    expect(staticRule.run).toHaveBeenCalledOnce()
    expect(idleRule.run).not.toHaveBeenCalled()
    expect(contextRule.run).not.toHaveBeenCalled()
  })
})
