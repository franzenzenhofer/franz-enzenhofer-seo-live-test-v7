import type { Rule } from '@/core/types'
import { sampleMatchingElements } from '@/shared/domEvidence'
import { elementEvidence } from '@/shared/elementEvidence'

const CSS_NOTE = 'CSS aspect-ratio can also reserve image space. This attribute check does not measure layout shifts or verify CSS sizing.'
export const imagesLayoutRule: Rule = {
  id: 'body:images-layout', name: 'Image dimension attributes', enabled: true, what: 'static',
  meta: {
    provenance: 'google', references: ['https://web.dev/articles/optimize-cls#images-without-dimensions', 'https://web.dev/articles/cls'],
    description: 'Identifies images missing width or height attributes by name and URL, without claiming to measure layout shifts.',
    userGuide: {
      check: 'Looks for width and height attributes on img elements. Reserving space before images load helps avoid page movement. Attribute values and CSS layout are not validated by this presence check.',
      action: 'For each listed image, declare width and height matching its aspect ratio, or verify that CSS already reserves the correct space. Set this in the image component or CMS template and recheck the page while images load.',
    },
  },
  async run(page) {
    const images = page.doc.querySelectorAll<HTMLImageElement>('img')
    const missing = sampleMatchingElements(images, (image) => !image.getAttribute('width') || !image.getAttribute('height'))
    return {
      label: 'BODY', name: 'Image dimension attributes', type: !images.length ? 'info' : missing.total ? 'warn' : 'ok', priority: missing.total ? 300 : 850,
      message: !images.length ? 'No img elements found.' : missing.total ? `${missing.total} images lack width or height attributes.`
        : `${images.length} images declare both width and height attributes.`,
      details: { note: CSS_NOTE, imagesChecked: images.length, count: missing.total,
        ...(missing.total ? { affectedImages: missing.sample.map((image) => ({ ...elementEvidence(image),
          missingAttributes: ['width', 'height'].filter((key) => !image.getAttribute(key)) })),
        examplesShown: missing.shown, examplesOmitted: missing.total - missing.shown } : {}) },
    }
  },
}
