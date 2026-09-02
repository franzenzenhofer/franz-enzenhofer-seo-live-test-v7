import { buildLinkedImageDetails, evaluateLinkedImages } from './linkedImages'

import type { Rule } from '@/core/types'

const LABEL = 'A11Y'
const NAME = 'Linked images need alt or text'
const RULE_ID = 'a11y:linked-images-alt'

export const linkedImagesAltRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'static',
  meta: {
    provenance: 'standard',
    references: [
      'https://html.spec.whatwg.org/multipage/images.html#a-link-or-button-containing-nothing-but-the-image',
      'https://html.spec.whatwg.org/multipage/images.html#alt',
      'https://developers.google.com/search/docs/appearance/google-images',
    ],
    description: 'Warns when a link contains an image with no (or empty) alt text and the link has no other text content; ok otherwise.',
  },
  async run(page) {
    const result = evaluateLinkedImages(
      page,
      (link) => {
        const img = link.querySelector('img')
        if (!img) return true // Not a linked image, pass

        const alt = (img?.getAttribute('alt') || '').trim()
        if (alt) return true // Image has alt text, pass

        const linkText = (link.textContent || '').trim()
        const hasAccessibleText = linkText.length > 0

        return hasAccessibleText // Pass if link has other text content
      },
      'linked images missing alt text or link text',
    )
    if (!result) {
      return { label: LABEL, message: 'Linked images have alt text or link text.', type: 'ok', priority: 850, name: NAME }
    }
    return {
      label: LABEL,
      message: result.message,
      type: 'warn',
      priority: 100,
      name: NAME,
      details: { ...buildLinkedImageDetails(result.failing, result.selectors, result.total), fix: 'Add descriptive alt text to linked images or provide visible link text.' },
    }
  },
}
