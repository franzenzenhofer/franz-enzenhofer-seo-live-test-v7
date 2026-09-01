import { enrichFromEvents } from './page.enrich'
import { discardBody, hasHeaders } from './http-utils'

import type { Page } from '@/core/types'
import type { EventRec } from '@/background/pipeline/types'
import type { ResourceLedger } from '@/background/pipeline/types'

type Head = { status?: number; headers?: Record<string, string> }

const head = async (url: string): Promise<Head> => {
  try {
    let r = await fetch(url, { method: 'HEAD', redirect: 'follow' })
    if (r.status === 405 || r.status === 501) {
      try { r = await fetch(url, { method: 'GET', redirect: 'follow' }) } catch { /* ignore */ }
    }
    discardBody(r)
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
  return { html, url, doc, status, headers, headerSource: hasHeaders(headers) ? 'probe' : undefined }
}

export const pageFromEvents = async (
  ev: EventRec[],
  makeDoc: (html: string) => Document,
  getHref: () => string,
  probe: (u: string) => Promise<Head> = head,
  resources?: ResourceLedger,
): Promise<Page> => {
  const p0 = enrichFromEvents(ev, makeDoc, getHref, resources)
  const extra = p0.extra as Partial<Page> & { headerChain?: unknown; headers?: Record<string, string> }
  const eventHeaders = hasHeaders(extra.headers) ? extra.headers : undefined
  const hasMainHeaders = Array.isArray(extra.headerChain) && extra.headerChain.length > 0
  // The probe is a live HEAD of the page, awaited before any rule runs. When the
  // navigation events already captured main-frame headers and status, its result
  // was ignored anyway - skip the request instead of paying a round trip per run.
  const needsProbe = !(hasMainHeaders && eventHeaders && typeof extra.status === 'number')
  const probed = needsProbe ? await probe(p0.url) : {}
  const base: Page = {
    html: p0.html,
    url: p0.url,
    doc: extra.staticDoc || makeDoc(''),
    status: probed.status,
    headers: probed.headers,
  }
  const probeHeaders = hasHeaders(base.headers) ? base.headers : undefined
  const headers = hasMainHeaders
    ? eventHeaders || probeHeaders
    : probeHeaders || eventHeaders
  const status = hasMainHeaders ? extra.status ?? base.status : base.status ?? extra.status
  const headerSource: Page['headerSource'] = headers ? (headers === probeHeaders ? 'probe' : 'events') : undefined
  return { ...base, ...extra, headers, status, headerSource }
}
