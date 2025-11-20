import type { Rule } from '@/core/types'
import { extractHtmlFromList, extractSnippet } from '@/shared/html-utils'

const SPEC = 'https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links'
const TESTED = 'Counted anchor tags using rel=\"nofollow\" to flag links excluded from passing signals.'

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
          nofollowCount: a.length,
          tested: TESTED,
          reference: SPEC,
        },
      }
    }

    return {
      label: 'BODY',
      message: 'No rel=nofollow links',
      type: 'ok',
      name: 'Nofollow Links',
      details: { tested: TESTED, reference: SPEC, nofollowCount: 0 },
    }
  },
}
