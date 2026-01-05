import type { Rule } from '@/core/types'
import { extractHtml, extractSnippet } from '@/shared/html-utils'
import { getDomPath } from '@/shared/dom-path'

// Constants
const LABEL = 'HEAD'
const NAME = 'AMP HTML Link'
const RULE_ID = 'head:amphtml'
const SELECTOR = 'head > link[rel~="amphtml" i]'
const SPEC = 'https://developers.google.com/search/docs/appearance/amp'

export const amphtmlRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'static',
  async run(page) {
    const element = page.doc.querySelector(SELECTOR)
    const href = element?.getAttribute('href')?.trim() || ''
    if (!element) {
      return {
        label: LABEL,
        name: NAME,
        message: 'No amphtml link present.',
        type: 'info',
        priority: 950,
        details: { reference: SPEC },
      }
    }

    const sourceHtml = extractHtml(element)
    const hasHref = href.length > 0
    return {
      label: LABEL,
      name: NAME,
      message: hasHref ? `Link rel=amphtml URL: ${href}` : 'amphtml link present but href missing.',
      type: hasHref ? 'info' : 'warn',
      priority: 500,
      details: {
        sourceHtml,
        snippet: extractSnippet(href || sourceHtml),
        domPath: getDomPath(element),
        href: href || '(empty)',
        validatorUrl: hasHref ? `https://validator.ampproject.org/#url=${href}` : undefined,
        reference: SPEC,
      },
    }
  },
}
