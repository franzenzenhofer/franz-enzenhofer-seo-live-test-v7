import { hasHeaders } from './http-utils'
import { observedSoftNavigation } from './softNavigation'

import type { Page } from '@/core/types'

/**
 * Names where `page.status` / `page.headers` come from, so no rule presents a
 * live HEAD of the URL as the response the navigation received. After a soft
 * navigation (history API) there IS no navigation response for the URL: the
 * document was not reloaded, the ledger shows a `history_api` hop, and the only
 * response the pipeline can offer is a separate HEAD request of the page URL.
 */
export const MAIN_DOCUMENT_RESPONSE = 'Main-document HTTP response'
export const HEAD_PROBE_RESPONSE = 'HEAD probe of the page URL (no main-document response captured)'
export const NO_NAVIGATION_RESPONSE =
  'In-page navigation (history API): the page changed its URL without loading a new document, so no navigation response exists for this URL'

type ResponsePage = Pick<Page, 'status' | 'headers' | 'headerSource'>

export const hasResponse = (page: ResponsePage): boolean => hasHeaders(page.headers) || typeof page.status === 'number'

/** The input label for a rule that read the response; false when nothing was captured. */
export const httpResponseInput = (page: ResponsePage): string | false => {
  if (!hasResponse(page)) return false
  return page.headerSource === 'probe' ? HEAD_PROBE_RESPONSE : MAIN_DOCUMENT_RESPONSE
}

export const responseSourceFact = (page: ResponsePage): string =>
  page.headerSource === 'probe' ? 'Separate HEAD request of the page URL' : 'Navigation response (webRequest, main frame)'

/** The soft-navigation fact for a run's events (`ctx.globals.events`), or null for a document load. */
export const navigationResponseNote = (globals: Record<string, unknown>): string | null => {
  const events = globals['events']
  return Array.isArray(events) && observedSoftNavigation(events as Array<{ t?: string }>) ? NO_NAVIGATION_RESPONSE : null
}
