import { runAll } from '../core/run'
import { registry } from '../rules/registry'
import { pageFromEvents } from '@/shared/page'
import { JSDOM } from 'jsdom'

import type { Ctx } from './types'

type Globals = { variables?: Record<string, unknown>; googleApiAccessToken?: string | null }

export const runAllCli = async (_rules: unknown[], ctx: Ctx) => {
  const makeDoc = (html: string) => new JSDOM(html).window.document
  const page = await pageFromEvents(ctx.events as unknown as import('@/background/pipeline/types').EventRec[], makeDoc, ()=>'about:blank')
  const globals = (ctx.globals || {}) as Globals
  // All rules enabled by default, no auto-enable needed
  const rules = registry as import('@/core/types').Rule[]
  return runAll(0, rules, page, { globals })
}
