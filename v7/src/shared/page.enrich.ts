import { findMainHeaders } from './page.headers'
import { domFactsToDocument } from './domFacts'
import type { DomPhaseFacts } from './domFacts'

import type { Result } from '@/core/types'
import type { EventRec } from '@/background/pipeline/types'

type DomData = {
  facts?: DomPhaseFacts
  html?: string
  navTiming?: unknown
  results?: Result[]
}

export const enrichFromEvents = (
  ev: EventRec[],
  makeDoc: (html: string) => Document,
  getHref: () => string,
) => {
  const idleDomEvent = [...ev].reverse().find((e) => e.t === 'dom:document_idle')
  const endDomEvent = [...ev].reverse().find((e) => e.t === 'dom:document_end')

  const endData = endDomEvent?.d as DomData | undefined
  const idleData = idleDomEvent?.d as DomData | undefined
  const staticHtml = (endData?.html || '').toString()
  const idleHtml = (idleData?.html || '').toString()

  const nav = ev.filter((e) => !!e.u && e.t.startsWith('nav:'))
  const firstUrl = (nav[0]?.u as string | undefined) || ''
  const lastUrl = ((nav.length ? nav[nav.length - 1] : undefined)?.u as string | undefined) || ''
  const url = lastUrl || firstUrl || getHref() || 'about:blank'

  const { headers, rawHeaders, status, resources, hops, statusLine, fromCache, ip } = findMainHeaders(ev, firstUrl, lastUrl)
  const staticDoc = endData?.facts ? domFactsToDocument(endData.facts, makeDoc) : makeDoc(staticHtml)
  const domIdleDoc = idleData?.facts
    ? domFactsToDocument(idleData.facts, makeDoc)
    : idleHtml ? makeDoc(idleHtml) : undefined
  const navigationTiming =
    idleData?.navTiming || endData?.navTiming ||
    null

  const extra: Record<string, unknown> = {
    firstUrl, lastUrl, rawHeaders,
    domIdleDoc, domEndDoc: endDomEvent ? staticDoc : undefined,
    staticDoc, staticHtml,
    staticDomAvailable: Boolean(endData?.facts || staticHtml), idleDomAvailable: Boolean(idleData?.facts || idleHtml),
    staticFacts: endData?.facts, idleFacts: idleData?.facts,
    phaseResults: [...(endData?.results || []), ...(idleData?.results || [])],
    resources, status, headers, statusLine, fromCache, ip,
    headerChain: hops,
    navigationTiming,
  }
  return { html: staticHtml, url, extra }
}
