import type { HeaderHop, HeaderResult } from './pageHeaderTypes'

import type { EventRec } from '@/background/pipeline/types'

// Only the fragment is dropped - it never reaches the server. A trailing slash
// or a query string is a DIFFERENT URL and may well answer with different
// headers, so this comparison must not blur them together.
const normalizeUrl = (u?: string): string => {
  if (!u) return ''
  try {
    const url = new URL(u)
    url.hash = ''
    return url.href
  } catch { return u.replace(/#.*$/, '') }
}

const urlsMatch = (a?: string, b?: string): boolean => normalizeUrl(a) === normalizeUrl(b)
const parseStatus = (raw?: Record<string, string | undefined>): number | undefined => {
  if (!raw) return undefined
  const s = raw['status'] || raw['Status'] || ''
  const n = parseInt(String(s).replace(/[^\d].*$/, ''), 10)
  return Number.isNaN(n) ? undefined : n
}

const buildHop = (e: EventRec): HeaderHop => {
  const raw = e.h as Record<string, string | undefined> | undefined
  const loc = raw?.['location'] || raw?.['Location']
  return {
    url: e.u || '',
    status: (e.sc as number | undefined) ?? parseStatus(raw),
    statusLine: e.sl,
    location: typeof loc === 'string' ? loc : undefined,
    redirectUrl: e.ru,
    ip: e.ip,
    headers: raw,
    headerFields: e.headerFields,
  }
}

const normalizeHeaders = (raw?: Record<string, string | undefined>) =>
  raw ? Object.fromEntries(Object.entries(raw).map(([k, v]) => [k.toLowerCase(), String(v ?? '')])) : undefined

export const findMainHeaders = (ev: EventRec[], firstUrl: string, lastUrl: string): HeaderResult => {
  const mainHeaders = ev.filter((e) => e.t === 'req:mainHeaders' && !!e.h)
  // Fallback resource list for callers without a resource ledger: SUBresources
  // only, matching the ledger's meaning - the document is not one of its own
  // resources.
  const resources = ev.filter((e) => e.t === 'req:headers' && !!e.u).map((e) => e.u!)
  const mainRedirects = ev.filter((e) => e.t === 'req:mainRedirect')

  // Document headers come from a main_frame response and from nowhere else. A
  // subresource's headers are not this document's: applying them would attach a
  // stylesheet's X-Robots-Tag or status to the page. With no main_frame
  // evidence the rules must say headers were not captured.
  let match = [...mainHeaders].reverse().find((e) => urlsMatch(e.u, lastUrl) || urlsMatch(e.u, firstUrl))
  if (!match && mainHeaders.length) match = mainHeaders[mainHeaders.length - 1]

  const hops = mainHeaders.map(buildHop)
  mainRedirects.forEach((r) => {
    const hop = hops.find((h) => urlsMatch(h.url, r.u))
    if (hop) hop.redirectUrl = r.ru || hop.redirectUrl
  })

  const lastHop = hops.length ? hops[hops.length - 1] : undefined
  const rawHeaders = (match?.h as Record<string, string | undefined> | undefined) || lastHop?.headers
  // Repeated fields must come from the SAME event as the merged headers, or a
  // second X-Robots-Tag from another response would be applied to this document.
  const headerFields = match?.h ? match.headerFields : lastHop?.headerFields
  const headers = normalizeHeaders(rawHeaders)

  // Find status from req:mainDone or req:done
  const mainDone = [...ev].reverse().find((e) => e.t === 'req:mainDone' && (urlsMatch(e.u, lastUrl) || urlsMatch(e.u, firstUrl)))
  const anyMainDone = [...ev].reverse().find((e) => e.t === 'req:mainDone')
  const statusEv = mainDone || anyMainDone
  const statusFromDone = (statusEv?.s as number | undefined) || undefined
  const statusLine = (statusEv?.sl as string | undefined) || lastHop?.statusLine
  const ip = (statusEv?.ip as string | undefined) || lastHop?.ip
  const fromCache = statusEv?.c === true
  if (fromCache && lastHop) lastHop.fromCache = true
  const status = headers?.['status'] ? parseInt(headers['status']!, 10) : lastHop?.status || statusFromDone

  return { headers, rawHeaders, headerFields, headerUrl: match?.u, status, resources, hops, statusLine, fromCache, ip }
}
