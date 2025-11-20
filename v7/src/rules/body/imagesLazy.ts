import type { Rule } from '@/core/types'
import { extractHtmlFromList, extractSnippet } from '@/shared/html-utils'

const SPEC = 'https://web.dev/browser-level-image-lazy-loading/'
const TESTED = 'Inspected all <img> elements for a loading attribute to confirm native lazy-loading usage.'

export const imagesLazyRule: Rule = {
  id: 'body:images-lazy',
  name: 'Images lazy-loading',
  enabled: true,
  what: 'static',
  async run(page) {
    const imgs = Array.from(page.doc.querySelectorAll('img')) as HTMLImageElement[]
    const noLoading: HTMLImageElement[] = []
    for (const i of imgs) {
      if (!i.getAttribute('loading')) noLoading.push(i)
    }

    if (noLoading.length > 0) {
      const sourceHtml = extractHtmlFromList(noLoading)
      return {
        label: 'BODY',
        message: `${noLoading.length} images without loading attribute`,
        type: 'info',
        name: 'Images lazy-loading',
        details: {
          sourceHtml,
          snippet: extractSnippet(sourceHtml),
          missingCount: noLoading.length,
          tested: TESTED,
          reference: SPEC,
        },
      }
    }

    return {
      label: 'BODY',
      message: 'Images have loading attribute',
      type: 'ok',
      name: 'Images lazy-loading',
      details: { tested: TESTED, reference: SPEC, missingCount: 0 },
    }
  },
}
