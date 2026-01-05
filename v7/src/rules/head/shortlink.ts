import type { Rule } from '@/core/types'
import { extractHtml, extractSnippet } from '@/shared/html-utils'
import { getDomPath } from '@/shared/dom-path'

const LABEL = 'HEAD'
const NAME = 'Shortlink'
const RULE_ID = 'head:shortlink'
const SELECTOR = 'head > link[rel~="shortlink" i]'
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
        message: 'No shortlink detected.',
        type: 'info',
        priority: 950,
        details: { reference: SPEC, hasShortlink: false },
      }
    }
    const sourceHtml = extractHtml(linkEl)
    if (!hasHref) {
      return {
        label: LABEL,
        name: NAME,
        message: 'Shortlink present but href missing.',
        type: 'warn',
        priority: 400,
        details: {
          sourceHtml,
          snippet: extractSnippet(sourceHtml),
          domPath: getDomPath(linkEl),
          href,
          hasShortlink,
          reference: SPEC,
        },
      }
    }

    const resolved = new URL(href, page.url).toString()
    const type: 'info' | 'warn' = resolved === page.url ? 'info' : 'warn'
    const message = `Shortlink detected: ${resolved}`

    return {
      label: LABEL,
      name: NAME,
      message,
      type,
      priority: type === 'info' ? 850 : 500,
      details: {
        sourceHtml,
        snippet: extractSnippet(sourceHtml),
        domPath: getDomPath(linkEl),
        href: resolved,
        hasShortlink,
        reference: SPEC,
      },
    }
  },
}
