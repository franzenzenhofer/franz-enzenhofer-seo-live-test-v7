import { buildLinkedImageDetails, evaluateLinkedImages } from './linkedImages'

import type { Rule } from '@/core/types'

const LABEL = 'A11Y'
const NAME = 'Linked images without alt and text'
const RULE_ID = 'a11y:linked-images-alt-no-text'
const SPEC = 'https://web.dev/alt-text/#linked-images-need-alt-text'

export const linkedImagesAltNoTextRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'static',
  async run(page) {
    const result = evaluateLinkedImages(
      page,
      (link) => {
        const img = link.querySelector('img')
        const alt = (img?.getAttribute('alt') || '').trim()
        const txt = (link.textContent || '').trim()
        return Boolean(alt || txt)
      },
      'linked images without alt and text',
    )
    if (!result) {
      return { label: LABEL, message: 'Linked images have alt or surrounding text.', type: 'ok', priority: 500, name: NAME, details: { reference: SPEC } }
    }
    return {
      label: LABEL,
      message: result.message,
      type: 'warn',
      priority: 150,
      name: NAME,
      details: { ...buildLinkedImageDetails(result.failing, result.selectors), reference: SPEC },
    }
  },
}
