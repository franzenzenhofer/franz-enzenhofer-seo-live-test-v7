import { findMainHeaders } from './page.headers'

import type { EventRec } from '@/background/pipeline/types'

export const enrichFromEvents = (
  ev: EventRec[],
  makeDoc: (html: string) => Document,
  getHref: () => string,
) => {
  // Prefer static snapshot (document_end), then DOMContentLoaded, then idle as fallback
  const idleDomEvent = [...ev].reverse().find((e) => e.t === 'dom:document_idle')
  const endDomEvent = [...ev].reverse().find((e) => e.t === 'dom:document_end')
  const dclDomEvent = [...ev].reverse().find((e) => e.t === 'dom:DOMContentLoaded')
  const staticDomEvent = endDomEvent || dclDomEvent || idleDomEvent

  const staticHtml = ((staticDomEvent?.d as { html?: string } | undefined)?.html || '').toString()
  const idleHtml = ((idleDomEvent?.d as { html?: string } | undefined)?.html || '').toString()

  const nav = ev.filter((e) => !!e.u && e.t.startsWith('nav:'))
  const firstUrl = (nav[0]?.u as string | undefined) || ''
  const lastUrl = ((nav.length ? nav[nav.length - 1] : undefined)?.u as string | undefined) || ''
  const url = lastUrl || firstUrl || getHref() || 'about:blank'

  const { headers, rawHeaders, status, resources, hops, statusLine, fromCache, ip } = findMainHeaders(ev, firstUrl, lastUrl)
  const staticDoc = makeDoc(staticHtml)
  const domIdleDoc = idleHtml ? makeDoc(idleHtml) : undefined
  const domEndDoc = endDomEvent?.d ? makeDoc(String((endDomEvent.d as { html?: string })?.html || '')) : undefined
  const dclDoc = dclDomEvent?.d ? makeDoc(String((dclDomEvent.d as { html?: string })?.html || '')) : undefined
  const navigationTiming =
    (idleDomEvent?.d as { navTiming?: unknown } | undefined)?.navTiming ||
    (staticDomEvent?.d as { navTiming?: unknown } | undefined)?.navTiming ||
    null

  const extra: Record<string, unknown> = {
    firstUrl, lastUrl, rawHeaders,
    domIdleDoc, domEndDoc, domContentLoadedDoc: dclDoc,
    staticDoc, staticHtml,
    resources, status, headers, statusLine, fromCache, ip,
    headerChain: hops,
    navigationTiming,
  }
  return { html: staticHtml, url, extra }
}
