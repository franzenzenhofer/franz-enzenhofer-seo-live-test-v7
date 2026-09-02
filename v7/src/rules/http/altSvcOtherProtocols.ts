import type { Rule } from '@/core/types'
import { extractSnippet } from '@/shared/html-utils'
import { hasHeaders, noHeadersResult } from '@/shared/http-utils'

// Constants
const LABEL = 'HTTP'
const NAME = 'Alt-Svc Alternative Protocols'
const RULE_ID = 'http:alt-svc-other'

export const altSvcOtherProtocolsRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'http',
  meta: {
    provenance: 'standard',
    references: ['https://www.rfc-editor.org/rfc/rfc7838.html#section-3'],
    description: "Parses the Alt-Svc header, splits advertised ALPN protocol-ids into standard (h2/h3/h3-drafts) vs 'other', and reports the full list (info-only).",
  },
  async run(page) {
    if (!hasHeaders(page.headers)) return noHeadersResult(LABEL, NAME)
    // 1. Extract Alt-Svc header value
    const altSvcHeader = page.headers?.['alt-svc'] || ''

    // 2. Determine states (Binary Logic)
    const isPresent = altSvcHeader.length > 0
    const altSvcClear = altSvcHeader.trim() === 'clear'

    // 3. Parse advertised protocols
    const protocols: string[] = []
    if (isPresent) {
      // Alt-Svc format: h2=":443"; ma=2592000, h3-29=":443"; ma=2592000
      const entries = altSvcHeader.split(',').map((e) => e.trim())
      entries.forEach((entry) => {
        const match = entry.match(/^([a-zA-Z0-9._-]+)=/)
        if (match && match[1]) protocols.push(match[1])
      })
    }

    // 4. Categorize protocols
    const standardProtocols = ['h2', 'h3', 'h3-29', 'h3-32'] // HTTP/2 and HTTP/3 versions
    const otherProtocols = protocols.filter((p) => !standardProtocols.some((sp) => p.startsWith(sp)))
    const hasOtherProtocols = otherProtocols.length > 0

    // 5. Build message (Quantified, showing protocols)
    let message = ''
    let priority = 800

    if (!isPresent) {
      message = 'No Alt-Svc header found.'
      priority = 900
    } else if (altSvcClear) {
      // RFC 7838 section 3: the case-sensitive value 'clear' invalidates all alternatives
      message = 'Alt-Svc: clear - origin invalidates all alternative services.'
      priority = 820
    } else if (protocols.length === 0) {
      message = `Alt-Svc header present but no protocols parsed.`
      priority = 850
    } else if (hasOtherProtocols) {
      message = `Alt-Svc: ${protocols.join(', ')} (Other protocols: ${otherProtocols.join(', ')})`
      priority = 700
    } else {
      message = `Alt-Svc: ${protocols.join(', ')}`
      priority = 750
    }

    // 6. Build evidence (Chain of Evidence)
    return {
      label: LABEL,
      name: NAME,
      message,
      type: 'info',
      priority,
      details: {
        httpHeaders: page.headers || {},
        snippet: extractSnippet(altSvcHeader || '(not present)', 100),
        altSvcHeader,
        altSvcClear,
        protocols,
        standardProtocols: protocols.filter((p) => standardProtocols.some((sp) => p.startsWith(sp))),
        otherProtocols,
      },
    }
  },
}

