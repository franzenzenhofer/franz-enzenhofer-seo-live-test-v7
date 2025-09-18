import type { Ctx } from '../types'

import simpleRobotParser from '@/vendor/robots'

export const buildRuleContext = (ctx: Ctx, page: unknown, title: string) => ({
  createResult: (...args: unknown[]) => {
    const base = { label: null, message: null, type: 'info', what: null, priority: 0 }
    if (args.length > 1) { const [label, message, type='info', what, priority=0] = args as [unknown, unknown, unknown, unknown, unknown]; return Object.assign(base, { label, message, type, what, priority }) }
    return Object.assign(base, args[0] as Record<string, unknown>)
  },
  getGlobals: () => (ctx.globals || {}),
  simpleRobotTxt: (txt: string, url: string, ua?: string) => simpleRobotParser(txt, url, ua),
  fetch: (url: string, options: Record<string, unknown> | undefined, cb: (r: unknown)=>void) => {
    const fmt = (options as { responseFormat?: 'text'|'json'|'arrayBuffer' } | undefined)?.responseFormat || 'text'
    fetch(url, options as RequestInit|undefined)
      .then((resp)=> ((resp as unknown) as Record<string, ()=> Promise<unknown>>)[fmt]!().then((data: unknown)=> cb({ status: (resp as Response).status, statusText: (resp as Response).statusText, ok: (resp as Response).ok, redirected: (resp as Response).redirected, url: (resp as Response).url, body: data })))
      .catch((e)=> cb({ ok:false, error:String(e) }))
  },
  htmlEntitiesEncode: (s: string) => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'),
  partialCodeLink: () => '',
  stringifyLink: (obj: unknown) => `<a href="data:text/plain;charset=utf-8,${encodeURIComponent(typeof obj==='string'?obj:JSON.stringify(obj,null,2))}" target="_blank">view</a>`,
  partialStringifyLink: (obj: unknown) => `<a href="data:text/plain;charset=utf-8,${encodeURIComponent(typeof obj==='string'?obj:JSON.stringify(obj,null,2))}" target="_blank">&lt;/&gt;</a>`,
  document: { title },
  page,
})
