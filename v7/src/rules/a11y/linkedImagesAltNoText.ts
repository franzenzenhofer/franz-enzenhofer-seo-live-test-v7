import type { Rule } from '@/core/types'
import { extractHtml, extractSnippet } from '@/shared/html-utils'

export const linkedImagesAltNoTextRule: Rule = {
  id: 'a11y:linked-images-alt-no-text',
  name: 'Linked images without alt and text',
  enabled: true,
  what: 'static',
  async run(page) {
    const problematic: Element[] = []
    const links = Array.from(page.doc.querySelectorAll('a'))
    for (const a of links) {
      const img = a.querySelector('img')
      if (!img) continue
      const alt = (img.getAttribute('alt') || '').trim()
      const txt = (a.textContent || '').trim()
      if (!alt && !txt) problematic.push(a)
    }

    if (problematic.length > 0) {
      const sourceHtml = problematic.map(el => extractHtml(el)).join('\n')
      return {
        label: 'A11Y',
        message: `${problematic.length} linked images without alt and text`,
        type: 'warn',
        name: 'Linked images without alt and text',
        details: {
          sourceHtml,
          snippet: extractSnippet(sourceHtml),
        },
      }
    }

    return {
      label: 'A11Y',
      message: 'Linked images have alt or text',
      type: 'ok',
      name: 'Linked images without alt and text',
    }
  },
}

