import { NavigationLedgerSchema } from '@/background/history/types'
import type { Rule } from '@/core/types'
import { getDomPath } from '@/shared/dom-path'
import { hasHeaders, noHeadersResult } from '@/shared/http-utils'

const LABEL = 'HTTP'
const NAME = 'Redirect/Canonical chain'
const RULE_ID = 'http:redirect-canonical-chain'
const SPEC = 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Redirections'

const normalize = (u?: string): string => {
  if (!u) return ''
  try {
    const url = new URL(u)
    url.hash = ''
    return url.href
  } catch {
    return (u || '').replace(/[?#].*$/, '')
  }
}

export const redirectCanonicalChainRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'http',
  async run(page, ctx) {
    if (!hasHeaders(page.headers)) return noHeadersResult(LABEL, NAME)
    const ledgerRaw = (ctx.globals as { navigationLedger?: unknown }).navigationLedger
    const ledger = NavigationLedgerSchema.safeParse(ledgerRaw)
    if (!ledger.success || !ledger.data.trace.length) {
      return {
        label: LABEL,
        name: NAME,
        message: 'No redirects or navigation chain captured.',
        type: 'info',
        priority: 900,
        details: { reference: SPEC },
      }
    }

    const trace = ledger.data.trace
    const headerChain = (page.headerChain || []).map((h) => ({ ...h }))
    const redirectCount = trace.filter((t) => t.type === 'http_redirect').length
    const historyCount = trace.filter((t) => t.type === 'history_api').length
    const finalUrl = trace[trace.length - 1]?.url || page.url

    if (redirectCount === 0 && historyCount === 0) {
      return {
        label: LABEL,
        name: NAME,
        message: 'Direct load (no redirects or history updates).',
        type: 'info',
        priority: 850,
        details: { trace, headerChain, reference: SPEC },
      }
    }

    const parts = trace.map((hop) => {
      const headerHop = headerChain.find((h) => normalize(h.url) === normalize(hop.url))
      const status = headerHop?.status ?? hop.statusCode
      const statusLine = headerHop?.statusLine ?? hop.statusText
      const location = headerHop?.redirectUrl || headerHop?.location
      const viaCache = headerHop?.fromCache

      let chunk = hop.url
      if (status) chunk += ` → HTTP ${status}`
      else if (statusLine) chunk += ` → ${statusLine}`
      if (location) chunk += ` → ${location}`
      if (viaCache) chunk += ' (via cache)'
      if (hop.type === 'history_api') chunk += ' → History API update'
      return chunk
    })

    let canonicalNote = ''
    const canonicalEl = page.doc.querySelector('link[rel~="canonical" i]')
    const canonicalHref = canonicalEl?.getAttribute('href') || ''
    const canonicalDomPath = getDomPath(canonicalEl)
    if (canonicalHref) {
      try {
        const resolved = new URL(canonicalHref, page.url).href
        const matches = normalize(resolved) === normalize(finalUrl)
        canonicalNote = `canonical ${matches ? '(OK)' : '(AWAY)'} → ${resolved}`
      } catch {
        canonicalNote = `canonical (invalid) → ${canonicalHref}`
      }
    }
    if (canonicalNote) parts.push(canonicalNote)

    if (page.fromCache) parts.push('via cache')

    const type: 'warn' | 'error' = redirectCount > 1 ? 'error' : 'warn'
    const priority = redirectCount > 1 ? 150 : 400

    return {
      label: LABEL,
      name: NAME,
      message: parts.join(' → '),
      type,
      priority,
      details: {
        trace,
        headerChain,
        finalUrl,
        redirectCount,
        historyCount,
        canonicalHref: canonicalNote || canonicalHref || null,
        domPath: canonicalDomPath || undefined,
        fromCache: page.fromCache ?? null,
        reference: SPEC,
      },
    }
  },
}
