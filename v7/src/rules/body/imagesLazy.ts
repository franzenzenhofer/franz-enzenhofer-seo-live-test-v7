import type { Rule } from '@/core/types'
import { extractHtmlFromList, extractSnippet } from '@/shared/html-utils'

export const imagesLazyRule: Rule = {
  id: 'body:images-lazy',
  name: 'Images lazy-loading',
  enabled: true,
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
        name: 'imagesLazy',
        details: {
          sourceHtml,
          snippet: extractSnippet(sourceHtml),
        },
      }
    }

    return {
      label: 'BODY',
      message: 'Images have loading attribute',
      type: 'ok',
      name: 'imagesLazy',
    }
  },
}

