import { parseHtmlDocument } from '@/shared/parseHtml'
import { followRedirectChain } from '@/shared/redirectChain'
import { formatRedirectChain } from '@/shared/redirectChainFormat'
import { pageEffectiveRobots } from '@/shared/effectiveRobots'
import { HTML_RESPONSE_BYTES, readBoundedText } from '@/shared/responseBody'
import { discardBody } from '@/shared/http-utils'

export const HREFLANG_SELECTOR = 'link[rel~="alternate" i][hreflang][href]'
export type HreflangTarget = { href: string; hreflang: string; declarations: string[] }
export type HreflangCheck = HreflangTarget & {
  status?: number; redirected?: boolean; selfReference?: boolean; backReference?: boolean
  canonical?: string | null; noindex?: boolean; error?: string; redirectChainText?: string
  bodyTruncated?: boolean
  issues: Array<{ level: 'warn' | 'error'; text: string }>
}
export const resolveHttpHref = (href: string, base: string): string | null => {
  if (!href.trim()) return null
  try { const url = new URL(href, base); return ['http:', 'https:'].includes(url.protocol) ? url.href : null } catch { return null }
}

export const checkHreflangTarget = async (
  target: HreflangTarget, source: { canonical: string; doc: Document }, signal?: AbortSignal,
): Promise<HreflangCheck> => {
  const check: HreflangCheck = { ...target, issues: [] }
  const issue = (level: 'warn' | 'error', text: string) => { check.issues.push({ level, text: `'${target.hreflang}' ${text}` }) }
  try {
    const { chain, response } = await followRedirectChain(target.href, { timeoutMs: 10000, wantBody: true, signal })
    check.status = chain.finalStatus
    check.redirected = chain.redirected
    check.redirectChainText = formatRedirectChain(chain)
    if (chain.loop || chain.capped) {
      if (response) discardBody(response)
      issue('error', `URL ${chain.loop ? 'enters a redirect loop' : `exceeds ${chain.maxHops} redirects`}.`)
      return check
    }
    if (chain.redirected) {
      const hops = chain.hopsHidden ? '' : ` (${chain.redirectCount} hop${chain.redirectCount === 1 ? '' : 's'})`
      issue('warn', `URL redirects${hops} to ${chain.finalUrl}.`)
    }
    if (chain.finalStatus !== 200) {
      // Never read a body this check will not parse - that is a stranger's bandwidth.
      if (response) discardBody(response)
      issue(chain.finalStatus === 403 || chain.finalStatus === 429 ? 'warn' : 'error', `returns HTTP ${chain.finalStatus}.`)
      return check
    }
    if (!response) throw new Error('Target response body unavailable')
    const body = await readBoundedText(response, { signal, maxBytes: HTML_RESPONSE_BYTES, timeoutMs: 10000 })
    check.bodyTruncated = body.truncated
    const dom = parseHtmlDocument(body.text, source.doc)
    const base = resolveHttpHref(dom.querySelector('base[href]')?.getAttribute('href') || '', chain.finalUrl) || chain.finalUrl
    const alternates = Array.from(dom.querySelectorAll(HREFLANG_SELECTOR))
      .map((el) => resolveHttpHref(el.getAttribute('href') || '', base)).filter(Boolean)
    check.selfReference = alternates.includes(target.href) || alternates.includes(chain.finalUrl)
    check.backReference = alternates.includes(source.canonical)
    // A cut body can only prove presence, never absence.
    const missing = body.truncated ? 'warn' : 'error'
    if (body.truncated) issue('warn', `body was cut at ${HTML_RESPONSE_BYTES} bytes; missing-reference findings are not conclusive.`)
    if (!check.selfReference) issue(missing, 'no self reference found.')
    if (!check.backReference) issue(missing, 'no back reference to canonical.')
    const canonicalHref = dom.querySelector('head > link[rel~="canonical" i]')?.getAttribute('href') || ''
    check.canonical = resolveHttpHref(canonicalHref, base)
    if (canonicalHref && !check.canonical) issue('error', 'target canonical is invalid.')
    else if (check.canonical && check.canonical !== chain.finalUrl) issue('warn', `target canonical points elsewhere: ${check.canonical}.`)
    const headers: Record<string, string> = {}
    response.headers?.forEach((value, name) => { headers[name.toLowerCase()] = value })
    check.noindex = pageEffectiveRobots({ doc: dom, headers }).noindex
    if (check.noindex) issue('error', 'target has an effective noindex directive for Googlebot.')
  } catch (error) {
    if (signal?.aborted) throw error
    check.error = error instanceof Error ? error.message : String(error)
    issue('warn', `check failed: ${check.error}`)
  }
  return check
}
