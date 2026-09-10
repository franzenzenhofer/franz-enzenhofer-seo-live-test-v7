import { resolvePageWebUrl } from '@/shared/resolvePageWebUrl'
import type { Rule } from '@/core/types'
import { extractHtml, extractSnippet } from '@/shared/html-utils'
import { getDomPath } from '@/shared/dom-path'

// Constants
const LABEL = 'HEAD'
const NAME = 'AMP HTML Link'
const RULE_ID = 'head:amphtml'
const SELECTOR = 'head > link[rel~="amphtml" i]'

export const amphtmlRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'static',
  meta: {
    userGuide: {
      check: "An amphtml link points to an optional AMP version of this page. This check validates and resolves the declared web address; it does not validate the destination as AMP.",
      action: "Correct the amphtml href if this site provides an AMP version, then validate that destination. If the site has no AMP version, remove the unused declaration; adding AMP is not required.",
    },
    provenance: 'standard',
    references: ['https://amp.dev/documentation/guides-and-tutorials/optimize-and-measure/discovery/'],
    description: 'Detects link[rel=amphtml] in <head> and reports the linked AMP URL (info) or a missing href (warn).',
  },
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
        details: {},
      }
    }

    const sourceHtml = extractHtml(element)
    const resolved = resolvePageWebUrl(href, page)
    const hasHref = Boolean(resolved)
    return {
      label: LABEL,
      name: NAME,
      message: hasHref ? 'Optional AMP version declared.' : 'amphtml href is missing or is not a valid HTTP or HTTPS URL.',
      type: hasHref ? 'info' : 'warn',
      priority: 500,
      details: {
        sourceHtml,
        snippet: extractSnippet(href || sourceHtml),
        domPath: getDomPath(element),
        href: href || '(empty)',
        ampUrl: resolved || undefined,
        validatorUrl: hasHref ? `https://validator.ampproject.org/#url=${encodeURIComponent(resolved!)}` : undefined,
      },
    }
  },
}
