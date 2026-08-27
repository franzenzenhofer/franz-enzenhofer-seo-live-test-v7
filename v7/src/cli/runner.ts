import { runAll } from '../core/run'
import { registry } from '../rules/registry'
import { createDisabledResult } from '../core/runHelpers'

import { pageFromHtml } from '@/shared/page'
import { JSDOM } from 'jsdom'

import type { Ctx } from './types'
import type { RegisteredRule, Result } from '@/core/types'

type Globals = { variables?: Record<string, unknown>; googleApiAccessToken?: string | null }

const pageUrl = (events: unknown[]) => [...events].reverse()
  .map((event) => (event as { u?: unknown }).u)
  .find((url): url is string => typeof url === 'string') || 'about:blank'

const unavailable = (rule: RegisteredRule): Result => ({
  name: rule.name,
  label: rule.input.toUpperCase(),
  message: `${rule.input === 'idle' ? 'Idle DOM lifecycle' : 'Cross-phase browser lifecycle'} unavailable for CLI HTML input.`,
  type: 'runtime_error',
  priority: 950,
  ruleId: rule.id,
})

export const runAllCli = async (_rules: unknown[], ctx: Ctx) => {
  const makeDoc = (html: string) => new JSDOM(html).window.document
  const page = await pageFromHtml(ctx.html, pageUrl(ctx.events), makeDoc)
  const globals = (ctx.globals || {}) as Globals
  const runnable = registry.filter((rule) => rule.input === 'static' || rule.input === 'context')
  const executed = await runAll(0, runnable, page, { globals })
  const byRule = new Map(executed.map((result) => [result.ruleId, result]))
  return registry.map((rule, index) => ({
    ...(byRule.get(rule.id) || (!rule.enabled ? createDisabledResult(rule, undefined) : unavailable(rule))),
    runIndex: index + 1,
  }))
}
