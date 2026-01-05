import type { Rule } from '@/core/types'
import { extractHtml, extractHtmlFromList } from '@/shared/html-utils'
import { getDomPath } from '@/shared/dom-path'

const LABEL = 'HEAD'
const NAME = 'SEO Title Present'
const SPEC = 'https://developers.google.com/search/docs/appearance/title-link'

export const titleRule: Rule = {
  id: 'head-title',
  name: NAME,
  enabled: true,
  what: 'static',
  run: async (page) => {
    const nodes = Array.from(page.doc.querySelectorAll('head > title'))
    const count = nodes.length
    const first = nodes[0]
    const title = (first?.textContent || '').trim()
    const isMissing = count === 0
    const isMultiple = count > 1
    const isEmpty = count === 1 && title.length === 0
    const isOk = count === 1 && !isEmpty

    const type: 'info' | 'error' = isOk ? 'info' : 'error'
    const message = isOk
      ? 'Title set.'
      : isMultiple
        ? `${count} <title> tags found in head (only one allowed).`
        : isMissing
          ? 'No <title> tag found in head.'
          : '<title> tag exists but is empty.'

    const sourceHtml = isMultiple ? extractHtmlFromList(nodes) : extractHtml(first ?? null)

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
        domPath: getDomPath(first ?? null),
        reference: SPEC,
      },
    }
  },
}
