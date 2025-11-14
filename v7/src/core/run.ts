import type { Rule, Result, Page, Ctx } from './types'

const enrichResult = (res: Result, rule: Rule): Result => {
  if (res.what && res.what.length > 0) return res
  return { ...res, what: rule.name }
}

export const runAll = async (rules: Rule[], page: Page, ctx: Ctx): Promise<Result[]> => {
  const out: Result[] = []
  for (const r of rules) {
    if (!r.enabled) continue
    const res = await r.run(page, ctx)
    if (Array.isArray(res)) out.push(...res.map((item) => enrichResult(item, r)))
    else out.push(enrichResult(res, r))
  }
  return out
}
