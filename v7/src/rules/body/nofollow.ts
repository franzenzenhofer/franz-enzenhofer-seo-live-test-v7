import type { Rule } from '@/core/types'
import { extractHtmlFromList, extractSnippet } from '@/shared/html-utils'

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
        name: 'nofollow',
        details: {
          sourceHtml,
          snippet: extractSnippet(sourceHtml),
        },
      }
    }

    return {
      label: 'BODY',
      message: 'No rel=nofollow links',
      type: 'ok',
      name: 'nofollow',
    }
  },
}
