import type { Rule } from '@/core/types'
import { extractHtmlFromList, extractSnippet } from '@/shared/html-utils'
import { getDomPaths } from '@/shared/dom-path'
import { sampleElements, sampleMatchingElements } from '@/shared/domEvidence'

const SPEC = 'https://web.dev/browser-level-image-lazy-loading/'

export const imagesLazyRule: Rule = {
  id: 'body:images-lazy',
  name: 'Images lazy-loading',
  enabled: true,
  what: 'static',
  async run(page) {
    const imgs = page.doc.querySelectorAll<HTMLImageElement>('img')
    const noLoading = sampleMatchingElements(imgs, (image) => !image.getAttribute('loading'))

    if (noLoading.total > 0) {
      const sourceHtml = extractHtmlFromList(noLoading.sample)
      return {
        label: 'BODY',
        message: `${noLoading.total} images without loading attribute`,
        type: 'info',
        priority: 600,
        name: 'Images lazy-loading',
        details: {
          sourceHtml,
          snippet: extractSnippet(sourceHtml),
          domPaths: getDomPaths(noLoading.sample),
          count: noLoading.total, shown: noLoading.shown, truncated: noLoading.truncated,
          reference: SPEC,
        },
      }
    }

    const all = sampleElements(imgs)
    const allHtml = extractHtmlFromList(all.sample)
    const domPaths = getDomPaths(all.sample)
    return {
      label: 'BODY',
      message: 'Images have loading attribute',
      type: 'ok',
      priority: 850,
      name: 'Images lazy-loading',
      details: {
        sourceHtml: allHtml,
        snippet: extractSnippet(allHtml),
        domPaths,
        count: all.total, shown: all.shown, truncated: all.truncated,
        tested: 'Validated <img> elements have loading attribute',
        reference: SPEC,
      },
    }
  },
}
