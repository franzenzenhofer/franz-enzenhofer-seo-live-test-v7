import type { Rule, Result, Page, Ctx } from './types'

export const runAll = async (rules: Rule[], page: Page, ctx: Ctx): Promise<Result[]> => {
  const out: Result[] = []
  for (const r of rules) {
    if (!r.enabled) continue
    const res = await r.run(page, ctx)
    if (Array.isArray(res)) out.push(...res)
    else out.push(res)
  }
  return out
}
