import { enrichFromEvents } from './page.enrich'

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
  const p0 = enrichFromEvents(ev, makeDoc, getHref)
  const base = await pageFromHtml(p0.html, p0.url, makeDoc, probe)
  return { ...base, ...p0.extra }
}
