import type { HeaderHop, HeaderResult } from './pageHeaderTypes'

import type { EventRec } from '@/background/pipeline/types'

const normalizeUrl = (u?: string): string => {
  if (!u) return ''
  try {
    const url = new URL(u)
    url.hash = ''
    return url.href.replace(/\/$/, '')
  } catch { return (u || '').replace(/[?#].*$/, '').replace(/\/$/, '') }
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
  }
}

const normalizeHeaders = (raw?: Record<string, string | undefined>) =>
  raw ? Object.fromEntries(Object.entries(raw).map(([k, v]) => [k.toLowerCase(), String(v ?? '')])) : undefined

export const findMainHeaders = (ev: EventRec[], firstUrl: string, lastUrl: string): HeaderResult => {
  const mainHeaders = ev.filter((e) => e.t === 'req:mainHeaders' && !!e.h)
  const allHeaders = ev.filter((e) => (e.t === 'req:headers' || e.t === 'req:mainHeaders') && !!e.h)
  const resources = allHeaders.map((e) => e.u!).filter(Boolean)
  const mainRedirects = ev.filter((e) => e.t === 'req:mainRedirect')

  let match = [...mainHeaders].reverse().find((e) => urlsMatch(e.u, lastUrl) || urlsMatch(e.u, firstUrl))
  if (!match && mainHeaders.length) match = mainHeaders[mainHeaders.length - 1]
  if (!match) match = [...allHeaders].reverse().find((e) => urlsMatch(e.u, lastUrl) || urlsMatch(e.u, firstUrl))
  if (!match) match = allHeaders.find((e) => !!e.h)

  const hops = mainHeaders.map(buildHop)
  mainRedirects.forEach((r) => {
    const hop = hops.find((h) => urlsMatch(h.url, r.u))
    if (hop) hop.redirectUrl = r.ru || hop.redirectUrl
  })

  const lastHop = hops.length ? hops[hops.length - 1] : undefined
  const rawHeaders = (match?.h as Record<string, string | undefined> | undefined) || lastHop?.headers
  const headers = normalizeHeaders(rawHeaders)

  // Find status from req:mainDone or req:done
  const mainDone = [...ev].reverse().find((e) => e.t === 'req:mainDone' && (urlsMatch(e.u, lastUrl) || urlsMatch(e.u, firstUrl)))
  const anyDone = [...ev].reverse().find((e) => (e.t === 'req:mainDone' || e.t === 'req:done') && (e.u === lastUrl || e.u === firstUrl))
  const fallbackDone = [...ev].reverse().find((e) => e.t === 'req:mainDone' || e.t === 'req:done')
  const statusEv = mainDone || anyDone || fallbackDone
  const statusFromDone = (statusEv?.s as number | undefined) || undefined
  const statusLine = (statusEv?.sl as string | undefined) || lastHop?.statusLine
  const ip = (statusEv?.ip as string | undefined) || lastHop?.ip
  const fromCache = statusEv?.c === true
  if (fromCache && lastHop) lastHop.fromCache = true
  const status = headers?.['status'] ? parseInt(headers['status']!, 10) : lastHop?.status || statusFromDone

  return { headers, rawHeaders, status, resources, hops, statusLine, fromCache, ip }
}
