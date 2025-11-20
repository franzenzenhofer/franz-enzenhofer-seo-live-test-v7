import { buildLinkedImageDetails, evaluateLinkedImages } from './linkedImages'

import type { Rule } from '@/core/types'

const LABEL = 'A11Y'
const NAME = 'Linked Images need alt'
const RULE_ID = 'a11y:linked-images-alt'
const SPEC = 'https://developer.mozilla.org/docs/Web/HTML/Element/img#attr-alt'

export const linkedImagesAltRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'static',
  async run(page) {
    const result = evaluateLinkedImages(page, (link) => {
      const img = link.querySelector('img')
      if (!img) return true // Not a linked image, pass

      const alt = (img?.getAttribute('alt') || '').trim()
      if (alt) return true // Image has alt text, pass

      // Image has no alt - check if link has other text content
      const linkText = link.textContent || ''
      // Check if there's meaningful text beyond whitespace
      const hasAccessibleText = linkText.trim().length > 0

      return hasAccessibleText // Pass if link has other text content
    }, 'linked images missing alt and no text')
    if (!result) {
      return { label: LABEL, message: 'Linked images have alt or accessible text.', type: 'ok', priority: 500, name: NAME, details: { reference: SPEC } }
    }
    return {
      label: LABEL,
      message: result.message,
      type: 'warn',
      priority: 100,
      name: NAME,
      details: { ...buildLinkedImageDetails(result.failing, result.selectors), reference: SPEC },
    }
  },
}
