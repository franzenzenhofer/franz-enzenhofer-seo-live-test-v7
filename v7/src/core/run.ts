import type { Rule, Result, Page, Ctx } from './types'
import { createDisabledResult, emitChunk } from './runHelpers'
import { runRuleQueue, CANCELLATION_ERROR } from './ruleQueue'

import { Logger } from '@/shared/logger'

type RunOptions = { signal?: AbortSignal }

export const runAll = async (
  tabId: number,
  rules: Rule[],
  page: Page,
  ctx: Ctx,
  emit?: (chunk: Result[]) => Promise<void> | void,
  options: RunOptions = {},
): Promise<Result[]> => {
  const runId = typeof ctx.globals['runId'] === 'string' ? ctx.globals['runId'] : undefined
  const enabled = rules.filter((rule) => rule.enabled)
  Logger.logDirectSend(tabId, 'rules', 'start', { total: rules.length, enabled: enabled.length, disabled: rules.length - enabled.length, url: page.url || 'unknown' })
  const slots: Array<Result | null> = []
  const tasks: Array<{ rule: Rule; slot: number; ordinal: number }> = []
  let ordinal = 0
  for (const rule of rules) {
    const slot = slots.length
    slots.push(null)
    if (!rule.enabled) {
      const disabled = createDisabledResult(rule, runId)
      slots[slot] = disabled
      await emitChunk(emit, [disabled])
      Logger.logDirectSend(tabId, 'rule', 'skip', { id: rule.id, name: rule.name, reason: 'disabled', state: 'disabled' })
      continue
    }
    ordinal++
    tasks.push({ rule, slot, ordinal })
  }
  try {
    await runRuleQueue({
      tabId,
      page,
      ctx,
      runId,
      tasks,
      emit,
      signal: options.signal,
      assign: (slot, result) => { slots[slot] = result },
    })
  } catch (error) {
    if (error instanceof Error && error.message === CANCELLATION_ERROR) throw error
    throw error
  }
  const out = slots.filter((res): res is Result => res !== null)
  Logger.logDirectSend(tabId, 'rules', 'done', {
    total: out.length,
    byType: { ok: out.filter((r) => r.type === 'ok').length, info: out.filter((r) => r.type === 'info').length, warn: out.filter((r) => r.type === 'warn').length, error: out.filter((r) => r.type === 'error').length },
  })
  return out
}
