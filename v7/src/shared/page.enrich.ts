import type { EventRec } from '@/background/pipeline/types'

export const enrichFromEvents = (
  ev: EventRec[],
  makeDoc: (html: string) => Document,
  getHref: () => string,
) => {
  const lastDom = [...ev].reverse().find((e) => e.t === 'dom:document_idle' || e.t === 'dom:document_end')
  const endDom = [...ev].reverse().find((e) => e.t === 'dom:document_end')
  const dclDom = [...ev].reverse().find((e) => e.t === 'dom:DOMContentLoaded')
  const html = ((lastDom?.d as { html?: string } | undefined)?.html || '').toString()

  const firstUrl = (ev.find((e) => !!e.u)?.u as string | undefined) || ''
  const lastUrl = ([...ev].reverse().find((e) => !!e.u)?.u as string | undefined) || ''
  const url = firstUrl || getHref() || 'about:blank'

  const reqHeaders = ev.filter((e) => e.t === 'req:headers')
  const statusFromDone = ([...ev].reverse().find((e) => e.t === 'req:done')?.s as number | undefined) || undefined
  const rawHeaders = (reqHeaders[reqHeaders.length - 1]?.h as Record<string, string | undefined> | undefined) || undefined
  const headers: Record<string, string> | undefined = rawHeaders
    ? Object.fromEntries(Object.entries(rawHeaders).map(([k, v]) => [k.toLowerCase(), String(v ?? '')]))
    : undefined
  const status = headers?.['status'] ? parseInt(headers['status']!, 10) : statusFromDone

  const resources = reqHeaders.map((e) => e.u!).filter(Boolean)

  const extra: Record<string, unknown> = {
    firstUrl,
    lastUrl,
    rawHeaders,
    domIdleDoc: lastDom?.d ? makeDoc(String((lastDom.d as { html?: string })?.html || '')) : undefined,
    domEndDoc: endDom?.d ? makeDoc(String((endDom.d as { html?: string })?.html || '')) : undefined,
    domContentLoadedDoc: dclDom?.d ? makeDoc(String((dclDom.d as { html?: string })?.html || '')) : undefined,
    resources,
    status,
    headers,
  }

  return { html, url, extra }
}
