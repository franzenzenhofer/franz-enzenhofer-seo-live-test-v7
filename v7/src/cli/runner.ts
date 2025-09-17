import { runAll } from '../core/run'
import { registry } from '../rules/registry'

import { buildPage } from './util/page'

import type { Ctx } from './types'

export const runAllCli = async (_rules: unknown[], ctx: Ctx) => {
  const page = buildPage(ctx)
  const doc = page.getStaticDom() as Document
  const url = page.getURL() || 'about:blank'
  let status: number|undefined; let headers: Record<string,string>|undefined
  try {
    const r = await fetch(url, { method: 'HEAD', redirect: 'follow' })
    status = r.status; const h: Record<string,string> = {}; r.headers.forEach((v,k)=>h[k.toLowerCase()]=v); headers = h
  } catch { /* ignore */ }
  return runAll(registry as import('@/core/types').Rule[], { html: ctx.html, url, doc, status, headers }, { globals: ctx.globals || {} })
}
