import { hasHeaders } from '@/shared/http-utils'
import { textField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'
import type { Rule } from '@/core/types'

const NAME = 'Link Header'
const RULE_ID = 'http:link-header'
const NO_MARKUP = 'None - this rule checks the HTTP response, not document markup'
const ENTRY_LIMIT = 10

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
  presentation: 1,
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
    if (!hasHeaders(page.headers)) {
      return presentResult(linkHeaderRule, page, {
        input: 'Not captured', type: 'runtime_error', priority: 50,
        values: [textField('Header capture', 'Not captured')],
        checked: [textField('Header name', 'Link'), textField('Capture requirement', 'Response headers must be captured')],
        noMarkup: NO_MARKUP,
      })
    }
    const linkHeader = page.headers?.['link'] || ''
    const hasLink = linkHeader.length > 0
    const links = hasLink ? splitLinkValues(linkHeader) : []
    const count = links.length
    const shown = links.slice(0, ENTRY_LIMIT)
    const headerRecord = { name: 'Captured response headers', fields: Object.entries(page.headers || {}).map(([key, value]) => textField(key, value)) }
    const entryRecord = { name: 'Parsed Link entries', fields: shown.length ? shown.map((value, index) => textField(`Entry ${index + 1}`, value)) : [textField('Entries', 'None')] }
    return presentResult(linkHeaderRule, page, {
      input: 'HTTP response headers', type: 'info', priority: hasLink ? 750 : 900,
      values: [textField('Link header', hasLink ? linkHeader : 'Not present'), textField('Link entries', count)],
      detailValues: count > shown.length ? [textField('Entries retained', shown.length), textField('Entries omitted', count - shown.length)] : [],
      checked: [textField('Header name', 'Link'), textField('Header source', 'Captured response headers'), textField('Entry splitting', 'Top-level commas outside quoted strings and angle-bracket URLs')],
      evidence: [entryRecord, headerRecord],
      noMarkup: NO_MARKUP,
    })
  },
}
