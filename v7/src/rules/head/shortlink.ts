import type { Rule } from '@/core/types'
import { extractHtml, extractSnippet, getDomPath } from '@/shared/html-utils'

const LABEL = 'HEAD'
const NAME = 'Shortlink'
const RULE_ID = 'head:shortlink'
const SELECTOR = 'head > link[rel="shortlink"]'
const SPEC = 'https://developer.wordpress.org/reference/functions/wp_get_shortlink/'

export const shortlinkRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'static',
  async run(page) {
    const linkEl = page.doc.querySelector(SELECTOR)
    const href = linkEl?.getAttribute('href')?.trim() || ''
    const hasShortlink = Boolean(linkEl)
    const hasHref = Boolean(href)
    if (!hasShortlink) {
      return {
        label: LABEL,
        name: NAME,
        message: 'No shortlink found.',
        type: 'info',
        priority: 900,
        details: { reference: SPEC },
      }
    }
    const sourceHtml = extractHtml(linkEl)
    const message = hasHref ? `Shortlink: ${href}` : 'Shortlink present but no href attribute.'
    return {
      label: LABEL,
      name: NAME,
      message,
      type: 'info',
      priority: 850,
      details: {
        sourceHtml,
        snippet: extractSnippet(sourceHtml),
        domPath: getDomPath(linkEl),
        href,
        hasShortlink,
        reference: SPEC,
      },
    }
  },
}

