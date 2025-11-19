import type { Rule } from '@/core/types'
import { extractSnippet } from '@/shared/html-utils'

const LABEL = 'HTTP'
const NAME = 'Link Header'
const RULE_ID = 'http:link-header'
const SPEC = 'https://datatracker.ietf.org/doc/html/rfc8288'

export const linkHeaderRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'http',
  async run(page) {
    const linkHeader = page.headers?.['link'] || ''
    const hasLink = linkHeader.length > 0
    const links = hasLink ? linkHeader.split(',').map((l) => l.trim()).filter(Boolean) : []
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
        reference: SPEC,
      },
    }
  },
}

