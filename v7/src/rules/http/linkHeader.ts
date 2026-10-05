import { headersNotCapturedResult } from './headersNotCaptured'
import { entryRecords, entryRows, parseLinkEntry, relOf } from './linkHeader.entries'
import { HEADER_NO_MARKUP, headerRow } from './observedHeader'

import { hasHeaders } from '@/shared/http-utils'
import { responseSourceFact } from '@/shared/httpResponseInput'
import { textField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'
import type { Rule } from '@/core/types'
import { listRow } from '@/shared/presentation/listRow'

const NAME = 'Link Header'
const RULE_ID = 'http:link-header'
const OVERVIEW_ENTRY_LIMIT = 3

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
    if (!hasHeaders(page.headers)) return headersNotCapturedResult(linkHeaderRule, page, 'Link')
    const linkHeader = page.headers?.['link'] || ''
    const hasLink = linkHeader.length > 0
    const links = hasLink ? splitLinkValues(linkHeader) : []
    const count = links.length
    const entries = links.map(parseLinkEntry)
    const relations = [...new Set(entries.map(relOf).filter(Boolean))]
    // The raw header embeds URLs, so the overview carries the parsed entries: each target keyed by
    // its rel for a short list, the count plus the relations for a long one (FORMATTING.md F9, F12).
    const values = !hasLink ? [headerRow('Link', '')]
      : count <= OVERVIEW_ENTRY_LIMIT ? entryRows(entries, page.url)
        : [textField('Link entries', count), textField('Relations', listRow(relations))]
    return presentResult(linkHeaderRule, page, {
      input: 'HTTP response headers', type: 'info', priority: hasLink ? 750 : 900,
      values,
      checked: [textField('Header name', 'Link'), textField('Response source', responseSourceFact(page)),
        textField('Entry splitting', 'Top-level commas outside quoted strings and angle-bracket URLs'),
        textField('Entry parsing', 'Target in angle brackets, then semicolon-separated parameters')],
      evidence: entryRecords(entries, page.url),
      noMarkup: HEADER_NO_MARKUP,
    })
  },
}
