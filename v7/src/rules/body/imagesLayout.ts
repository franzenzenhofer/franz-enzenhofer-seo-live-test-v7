import type { Rule } from '@/core/types'
import { extractHtmlFromList, extractSnippet } from '@/shared/html-utils'
import { getDomPaths } from '@/shared/dom-path'
import { sampleElements, sampleMatchingElements } from '@/shared/domEvidence'

const SPEC = 'https://web.dev/cls/#images-without-dimensions'

export const imagesLayoutRule: Rule = {
  id: 'body:images-layout',
  name: 'Images missing dimensions',
  enabled: true,
  what: 'static',
  async run(page) {
    const imgs = page.doc.querySelectorAll<HTMLImageElement>('img')
    const missing = sampleMatchingElements(imgs, (image) => !image.getAttribute('width') || !image.getAttribute('height'))

    if (missing.total > 0) {
      const sourceHtml = extractHtmlFromList(missing.sample)
      return {
        label: 'BODY',
        message: `${missing.total} images missing width/height`,
        type: 'warn',
        name: 'Images missing dimensions',
        details: {
          sourceHtml,
          snippet: extractSnippet(sourceHtml),
          domPaths: getDomPaths(missing.sample),
          count: missing.total, shown: missing.shown, truncated: missing.truncated,
          reference: SPEC,
        },
      }
    }

    const all = sampleElements(imgs)
    const allHtml = extractHtmlFromList(all.sample)
    const domPaths = getDomPaths(all.sample)
    return {
      label: 'BODY',
      message: 'All images have dimensions',
      type: 'ok',
      name: 'Images missing dimensions',
      details: {
        sourceHtml: allHtml,
        snippet: extractSnippet(allHtml),
        domPaths,
        count: all.total, shown: all.shown, truncated: all.truncated,
        tested: 'Checked <img> width/height attributes',
        reference: SPEC,
      },
    }
  },
}
