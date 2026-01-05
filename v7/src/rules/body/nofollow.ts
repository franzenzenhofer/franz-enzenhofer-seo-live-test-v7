import type { Rule } from '@/core/types'
import { extractHtmlFromList, extractSnippet } from '@/shared/html-utils'
import { getDomPaths } from '@/shared/dom-path'

const SPEC = 'https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links'

export const nofollowRule: Rule = {
  id: 'body:nofollow',
  name: 'Nofollow Links',
  enabled: true,
  what: 'static',
  async run(page) {
    const a = Array.from(page.doc.querySelectorAll('a[rel~="nofollow"]'))

    if (a.length > 0) {
      const sourceHtml = extractHtmlFromList(a)
      return {
        label: 'BODY',
        message: `${a.length} nofollow links`,
        type: 'info',
        name: 'Nofollow Links',
        details: {
          sourceHtml,
          snippet: extractSnippet(sourceHtml),
          domPaths: getDomPaths(a),
          reference: SPEC,
        },
      }
    }

    const sourceHtml = extractHtmlFromList(a)
    return {
      label: 'BODY',
      message: 'No rel=nofollow links',
      type: 'ok',
      name: 'Nofollow Links',
      details: {
        sourceHtml,
        snippet: extractSnippet(sourceHtml),
        domPaths: getDomPaths(a),
        tested: 'Checked <a> rel values for nofollow',
        reference: SPEC,
      },
    }
  },
}
