import { runAll } from '../core/run'
import { registry } from '../rules/registry'
import { pageFromEvents } from '@/shared/page'
import { JSDOM } from 'jsdom'

import type { Ctx } from './types'

export const runAllCli = async (_rules: unknown[], ctx: Ctx) => {
  const makeDoc = (html: string) => new JSDOM(html).window.document
  const page = await pageFromEvents(ctx.events as unknown as import('@/background/pipeline/types').EventRec[], makeDoc, ()=>'about:blank')
  return runAll(registry as import('@/core/types').Rule[], page, { globals: ctx.globals || {} })
}
