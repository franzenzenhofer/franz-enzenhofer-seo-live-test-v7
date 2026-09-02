import type { Rule } from '@/core/types'
import { extractSnippet } from '@/shared/html-utils'
import { hasHeaders, noHeadersResult } from '@/shared/http-utils'

const LABEL = 'HTTP'
const NAME = 'Link Header'
const RULE_ID = 'http:link-header'

const splitLinkValues = (value: string): string[] => {
  const parts: string[] = []
  let current = ''
  let inQuotes = false
  let inAngle = false
  for (let i = 0; i < value.length; i++) {
    const ch = value.charAt(i)
    if (inQuotes && ch === '\\' && i + 1 < value.length) {
      current += ch + value.charAt(i + 1)
      i++
      continue
    }
    if (ch === '"' && !inAngle) {
      inQuotes = !inQuotes
    } else if (ch === '<' && !inQuotes && !inAngle) {
      inAngle = true
    } else if (ch === '>' && inAngle) {
      inAngle = false
    } else if (ch === ',' && !inQuotes && !inAngle) {
      parts.push(current.trim())
      current = ''
      continue
    }
    current += ch
  }
  parts.push(current.trim())
  return parts.filter(Boolean)
}

export const linkHeaderRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'http',
  meta: {
    provenance: 'standard',
    references: [
      'https://www.rfc-editor.org/rfc/rfc8288',
      'https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls',
    ],
    description:
      'Reports presence of the Link response header and counts its entries by splitting the value on commas (always type info).',
  },
  async run(page) {
    if (!hasHeaders(page.headers)) return noHeadersResult(LABEL, NAME)
    const linkHeader = page.headers?.['link'] || ''
    const hasLink = linkHeader.length > 0
    const links = hasLink ? splitLinkValues(linkHeader) : []
    const count = links.length
    let message = ''
    if (!hasLink) {
      message = 'No Link header found.'
    } else if (count === 1) {
      message = `Link header: 1 entry`
    } else {
      message = `Link header: ${count} entries`
    }
    return {
      label: LABEL,
      name: NAME,
      message,
      type: 'info',
      priority: hasLink ? 750 : 900,
      details: {
        httpHeaders: page.headers || {},
        snippet: extractSnippet(linkHeader || '(not present)', 150),
        linkHeader,
        links,
        count,
      },
    }
  },
}
