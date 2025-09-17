import type { Page } from '@/core/types'
import type { EventRec } from '@/background/pipeline/types'

type Head = { status?: number; headers?: Record<string, string> }

const head = async (url: string): Promise<Head> => {
  try {
    let r = await fetch(url, { method: 'HEAD', redirect: 'follow' })
    if (r.status === 405 || r.status === 501) {
      try { r = await fetch(url, { method: 'GET', redirect: 'follow' }) } catch { /* ignore */ }
    }
    const h: Record<string, string> = {}
    r.headers.forEach((v, k) => (h[k.toLowerCase()] = v))
    return { status: r.status, headers: h }
  } catch {
    return {}
  }
}

export const pageFromHtml = async (
  html: string,
  url: string,
  makeDoc: (html: string) => Document,
  probe: (u: string) => Promise<Head> = head,
): Promise<Page> => {
  const doc = makeDoc(html)
  const { status, headers } = await probe(url)
  return { html, url, doc, status, headers }
}

export const pageFromEvents = async (
  ev: EventRec[],
  makeDoc: (html: string) => Document,
  getHref: () => string,
  probe: (u: string) => Promise<Head> = head,
): Promise<Page> => {
  const lastDom = [...ev].reverse().find((e) => e.t === 'dom:document_idle' || e.t === 'dom:document_end')
  const html = ((lastDom?.d as { html?: string } | undefined)?.html || '').toString()
  const firstUrl = ([...ev].reverse().find((e) => !!e.u)?.u as string | undefined) || ''
  const url = firstUrl || (getHref() || 'about:blank')
  const res = ev.filter((e)=> e.t === 'req:headers' && !!e.u).map((e)=> e.u!)
  const p = await pageFromHtml(html, url, makeDoc, probe)
  return { ...p, resources: res }
}
