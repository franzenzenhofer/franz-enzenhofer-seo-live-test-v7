import type { Rule } from '@/core/types'
import { extractHtml, extractSnippet, getDomPath } from '@/shared/html-utils'

export const metaDescriptionRule: Rule = {
  id: 'head-meta-description',
  name: 'Meta Description',
  enabled: true,
  run: async (page) => {
    const nodes = page.doc.querySelectorAll('meta[name="description"]')

    if (nodes.length === 0) {
      return {
        label: 'BODY',
        message: 'No meta description found.',
        type: 'error',
        what: 'static',
        priority: 0,
        name: 'metaDescription',
      }
    }

    if (nodes.length > 1) {
      const sourceHtml = Array.from(nodes).map(n => extractHtml(n)).join('\n')
      return {
        label: 'HEAD',
        message: 'Multiple meta description found.',
        type: 'error',
        what: 'static',
        priority: 0,
        name: 'metaDescription',
        details: {
          sourceHtml,
          snippet: extractSnippet(sourceHtml),
        },
      }
    }

    const metaEl = nodes[0] as HTMLMetaElement
    const content = metaEl.content || ''
    const sourceHtml = extractHtml(metaEl)

    return {
      label: 'HEAD',
      message: `Meta description: ${content}`,
      type: 'info',
      what: 'static',
      priority: 760,
      name: 'metaDescription',
      details: {
        sourceHtml,
        snippet: extractSnippet(sourceHtml),
        domPath: getDomPath(metaEl),
      },
    }
  },
}
