import type { Ctx } from '../types'

import { parseHtml } from './dom'

export const buildPage = (ctx: Ctx) => {
  const dom = parseHtml(ctx.html)
  const evs = ctx.events as unknown[]
  const findLast = (pred: (e: unknown)=>boolean) => { for (let k=evs.length-1;k>=0;k--) if (pred(evs[k])) return evs[k]; return null }
  const lastDom = findLast((e)=> (e as { t?: string }).t==='dom:document_idle'||(e as { t?: string }).t==='dom:document_end') as { d?: { location?: { href?: string } } } | null
  const firstUrl = (findLast((e)=> !!(e as { u?: string }).u) as { u?: string } | null)?.u
  const url = firstUrl || lastDom?.d?.location?.href || 'about:blank'
  const location = { href: url }
  let headers: Record<string,string> | null = null
  let status: number | undefined
  ;(async()=>{
    try {
      const r = await fetch(url, { method: 'HEAD', redirect: 'follow' })
      status = r.status; const h: Record<string,string> = {}; r.headers.forEach((v,k)=>h[k.toLowerCase()]=v); headers = h
    } catch {/* ignore */}
  })()
  const eventsOfType = (type: string) => {
    const map: Record<string,string> = { onHeadersReceived:'req:headers', onCompleted:'req:done', documentIdle:'dom:document_idle', documentEnd:'dom:document_end' }
    const key = map[type] || type; return evs.filter((e)=> (e as { t?: string }).t===key)
  }
  return {
    events: ctx.events,
    eventsOfType,
    firstEventOfType: (t: string)=>eventsOfType(t)[0],
    lastEventOfType: (t: string)=>{ const a=eventsOfType(t); return a[a.length-1] },
    getStaticDom: () => dom.window.document,
    documentEndEvent: () => ({ document: dom.window.document, location }),
    domContentLoadedEvent: () => ({ document: dom.window.document, location }),
    documentIdleEvent: () => ({ document: dom.window.document, location }),
    getIdleDom: () => dom.window.document,
    getLocation: () => location,
    getURL: () => url,
    getHttpHeaders: () => headers || {},
    getRawHttpHeaders: () => headers || {},
    getStatusCode: () => status,
    hasGscAccess: (token: string, hasF: ()=>void, noF: ()=>void) => { if(!token){noF();return false} noF(); return false },
  }
}
