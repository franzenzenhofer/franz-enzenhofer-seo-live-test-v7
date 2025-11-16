import type { Rule } from '@/core/types'
import { extractHtmlFromList, extractSnippet } from '@/shared/html-utils'

export const linkedImagesAltRule: Rule = {
  id: 'a11y:linked-images-alt',
  name: 'Linked Images need alt',
  enabled: true,
  what: 'static',
  async run(page) {
    const imgs = page.doc.querySelectorAll('a img')
    const missingAlt: Element[] = []
    imgs.forEach(img => {
      const alt = (img.getAttribute('alt') || '').trim()
      if (!alt) missingAlt.push(img)
    })

    if (missingAlt.length > 0) {
      const sourceHtml = extractHtmlFromList(missingAlt)
      return {
        label: 'A11Y',
        message: `${missingAlt.length} linked images missing alt`,
        type: 'warn',
        name: 'Linked Images need alt',
        details: {
          sourceHtml,
          snippet: extractSnippet(sourceHtml),
        },
      }
    }

    const sourceHtml = extractHtmlFromList(imgs)
    return {
      label: 'A11Y',
      message: 'Linked images have alt',
      type: 'ok',
      name: 'Linked Images need alt',
      details: {
        sourceHtml,
        snippet: extractSnippet(sourceHtml),
      },
    }
  },
}
