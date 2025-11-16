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
      const alt = (img?.getAttribute('alt') || '').trim()
      return Boolean(alt)
    }, 'linked images missing alt')
    if (!result) {
      return { label: LABEL, message: 'Linked images have alt.', type: 'ok', priority: 500, name: NAME, details: { reference: SPEC } }
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
