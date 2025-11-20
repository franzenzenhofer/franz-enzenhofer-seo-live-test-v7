import type { Rule } from '@/core/types'
import { extractHtmlFromList, extractSnippet } from '@/shared/html-utils'

const SPEC = 'https://web.dev/cls/#images-without-dimensions'
const TESTED = 'Checked all <img> tags for explicit width and height attributes to prevent layout shifts.'

export const imagesLayoutRule: Rule = {
  id: 'body:images-layout',
  name: 'Images missing dimensions',
  enabled: true,
  what: 'static',
  async run(page) {
    const imgs = Array.from(page.doc.querySelectorAll('img')) as HTMLImageElement[]
    const missing: HTMLImageElement[] = []
    for (const i of imgs) {
      if (!i.getAttribute('width') || !i.getAttribute('height')) missing.push(i)
    }

    if (missing.length > 0) {
      const sourceHtml = extractHtmlFromList(missing)
      return {
        label: 'BODY',
        message: `${missing.length} images missing width/height`,
        type: 'warn',
        name: 'Images missing dimensions',
        details: {
          sourceHtml,
          snippet: extractSnippet(sourceHtml),
          missingCount: missing.length,
          tested: TESTED,
          reference: SPEC,
        },
      }
    }

    return {
      label: 'BODY',
      message: 'All images have dimensions',
      type: 'ok',
      name: 'Images missing dimensions',
      details: { tested: TESTED, reference: SPEC, missingCount: 0 },
    }
  },
}
