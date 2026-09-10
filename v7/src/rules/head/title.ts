import type { Rule } from '@/core/types'
import { extractHtml, extractHtmlFromList } from '@/shared/html-utils'
import { getDomPath } from '@/shared/dom-path'
import { sampleElements } from '@/shared/domEvidence'

const LABEL = 'HEAD'
const NAME = 'SEO Title Present'

export const titleRule: Rule = {
  id: 'head-title',
  name: NAME,
  enabled: true,
  what: 'static',
  meta: {
    userGuide: {
      check: "Checks for exactly one non-empty title element in the document head. The title names the browser tab and can inform the search result title; Google may choose different wording.",
      action: "In the page template or CMS SEO title field, provide one descriptive title for this page. Remove duplicate title output from competing templates or plugins and make sure the remaining title is inside head.",
    },
    provenance: 'google',
    references: [
      'https://developers.google.com/search/docs/appearance/title-link',
      'https://html.spec.whatwg.org/multipage/semantics.html#the-title-element',
    ],
    description: 'Checks that exactly one non-empty <title> element exists in <head> (error on missing, multiple, or empty).',
  },
  run: async (page) => {
    const nodes = sampleElements(page.doc.querySelectorAll('head > title'))
    const count = nodes.total
    const first = nodes.sample[0]
    const title = (first?.textContent || '').trim()
    const isMissing = count === 0
    const isMultiple = count > 1
    const isEmpty = count === 1 && title.length === 0
    const isOk = count === 1 && !isEmpty

    const type: 'ok' | 'error' = isOk ? 'ok' : 'error'
    const message = isOk
      ? `Title present (${title.length} characters).`
      : isMultiple
        ? `${count} <title> tags found in head (only one allowed).`
        : isMissing
          ? 'No <title> tag found in head.'
          : '<title> tag exists but is empty.'

    const sourceHtml = isMultiple ? extractHtmlFromList(nodes.sample) : extractHtml(first ?? null)

    return {
      label: LABEL,
      name: NAME,
      message,
      type,
      priority: isOk ? 1000 : 0,
      details: {
        snippet: isOk ? `<title>${title}</title>` : undefined,
        title,
        length: title.length,
        sourceHtml,
        count,
        shown: nodes.shown,
        truncated: nodes.truncated,
        domPath: getDomPath(first ?? null),
      },
    }
  },
}
