import { findMainHeaders } from './page.headers'
import { domFactsToDocument } from './domFacts'
import { collectPhaseResults } from './phaseResults'
import type { DomPhaseFacts } from './domFacts'

import type { Result } from '@/core/types'
import type { EventRec } from '@/background/pipeline/types'
import type { ResourceLedger } from '@/background/pipeline/types'

type DomData = {
  facts?: DomPhaseFacts
  html?: string
  baseUri?: string
  navTiming?: unknown
  results?: Result[]
}

export const enrichFromEvents = (
  ev: EventRec[],
  makeDoc: (html: string) => Document,
  getHref: () => string,
  resourceLedger?: ResourceLedger,
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

  const { headers, rawHeaders, headerFields, headerUrl, status, resources, hops, statusLine, fromCache, ip } = findMainHeaders(ev, firstUrl, lastUrl)
  const staticDoc = endData?.facts ? domFactsToDocument(endData.facts, makeDoc) : makeDoc(staticHtml)
  const domIdleDoc = idleData?.facts ? undefined : idleHtml ? makeDoc(idleHtml) : undefined
  const navigationTiming =
    idleData?.navTiming || endData?.navTiming ||
    null

  // The document's own base URI decides how every relative href resolves; it
  // travels with the phase capture, so relative-link rules must use it and not
  // guess from the page URL.
  const baseUri = idleData?.baseUri || endData?.baseUri || idleData?.facts?.baseUri || endData?.facts?.baseUri

  const extra: Record<string, unknown> = {
    firstUrl, lastUrl, rawHeaders, baseUri,
    domIdleDoc, domEndDoc: endDomEvent ? staticDoc : undefined,
    staticDoc, staticHtml,
    staticDomAvailable: Boolean(endData?.facts || staticHtml), idleDomAvailable: Boolean(idleData?.facts || idleHtml),
    staticFacts: endData?.facts, idleFacts: idleData?.facts,
    phaseResults: collectPhaseResults(ev),
    resources: resourceLedger ? resourceLedger.facts.map((fact) => fact.url) : resources,
    resourceCount: resourceLedger ? resourceLedger.facts.length : resources.length,
    resourceDropped: resourceLedger?.droppedObservations ?? 0,
    resourceFacts: resourceLedger?.facts,
    resourceCoverage: resourceLedger && {
      events: resourceLedger.events, completed: resourceLedger.completed,
      retained: resourceLedger.facts.length, dropped: resourceLedger.droppedObservations,
      truncated: resourceLedger.truncated,
    },
    status, headers, responseHeaderFields: headerFields, headerUrl, statusLine, fromCache, ip,
    headerChain: hops,
    navigationTiming,
  }
  return { html: staticHtml, url, extra }
}
