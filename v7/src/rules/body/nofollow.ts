import type { Rule } from '@/core/types'
import { extractHtmlFromList, extractSnippet } from '@/shared/html-utils'
import { getDomPaths } from '@/shared/dom-path'
import { sampleElements } from '@/shared/domEvidence'

const SPEC = 'https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links'

export const nofollowRule: Rule = {
  id: 'body:nofollow',
  name: 'Nofollow Links',
  enabled: true,
  what: 'static',
  async run(page) {
    const { sample, total, shown, truncated } = sampleElements(page.doc.querySelectorAll('a[rel~="nofollow"]'))

    if (total > 0) {
      const sourceHtml = extractHtmlFromList(sample)
      return {
        label: 'BODY',
        message: `${total} nofollow links`,
        type: 'info',
        priority: 700,
        name: 'Nofollow Links',
        details: {
          sourceHtml,
          snippet: extractSnippet(sourceHtml),
          domPaths: getDomPaths(sample),
          count: total,
          shown,
          truncated,
          reference: SPEC,
        },
      }
    }

    return {
      label: 'BODY',
      message: 'No rel=nofollow links',
      type: 'ok',
      priority: 850,
      name: 'Nofollow Links',
      details: {
        sourceHtml: '',
        snippet: '',
        domPaths: [],
        tested: 'Checked <a> rel values for nofollow',
        reference: SPEC,
      },
    }
  },
}
