import { enrichFromEvents } from './page.enrich'

import type { Page } from '@/core/types'
import type { EventRec } from '@/background/pipeline/types'

type Head = { status?: number; headers?: Record<string, string> }

const hasHeaders = (headers?: Record<string, string>) => !!headers && Object.keys(headers).length > 0

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
  const extra = p0.extra as Partial<Page> & { headerChain?: unknown; headers?: Record<string, string> }
  const eventHeaders = hasHeaders(extra.headers) ? extra.headers : undefined
  const probeHeaders = hasHeaders(base.headers) ? base.headers : undefined
  const hasMainHeaders = Array.isArray(extra.headerChain) && extra.headerChain.length > 0
  const headers = hasMainHeaders
    ? eventHeaders || probeHeaders
    : probeHeaders || eventHeaders
  const status = hasMainHeaders ? extra.status ?? base.status : base.status ?? extra.status
  return { ...base, ...extra, headers, status }
}
