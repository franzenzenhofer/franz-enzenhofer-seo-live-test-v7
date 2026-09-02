import type { Rule } from '@/core/types'
import { extractHtml, extractSnippet } from '@/shared/html-utils'
import { getDomPath } from '@/shared/dom-path'

// Constants
const LABEL = 'HEAD'
const NAME = 'Twitter Card'
const RULE_ID = 'head:twitter-card'
const SELECTOR = 'head > meta[name="twitter:card"]'

// Valid Twitter Card types per spec
const VALID_CARD_TYPES = ['summary', 'summary_large_image', 'app', 'player']

export const twitterCardRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'static',
  meta: {
    provenance: 'general',
    references: ['https://web.archive.org/web/20240526100043/https://developer.x.com/en/docs/twitter-for-websites/cards/overview/markup'],
    description: 'Checks meta[name=twitter:card] presence and validates its value against {summary, summary_large_image, app, player}.',
  },
  async run(page) {
    // 1. Query with precision selector
    const element = page.doc.querySelector(SELECTOR)

    // 2. Extract card type and handle whitespace
    const cardType = (element?.getAttribute('content') || '').trim()

    // 3. Determine states (Binary Logic)
    const isPresent = Boolean(element)
    const hasCardType = isPresent && cardType.length > 0
    const isValidType = hasCardType && VALID_CARD_TYPES.includes(cardType)

    // 4. Build message (Quantified, showing the value)
    let message = ''
    let type: 'ok' | 'warn' | 'info' = 'info'
    let priority = 700

    if (!isPresent) {
      message = 'No twitter:card meta tag found. (Falls back to Open Graph tags)'
      type = 'info'
      priority = 900
    } else if (!hasCardType) {
      message = 'twitter:card meta tag present but content is empty.'
      type = 'warn'
      priority = 500
    } else if (isValidType) {
      message = `twitter:card=${cardType}`
      type = 'ok'
      priority = 750
    } else {
      message = `twitter:card=${cardType} (Invalid card type. Valid: ${VALID_CARD_TYPES.join(', ')})`
      type = 'warn'
      priority = 400
    }

    // 5. Build evidence (Chain of Evidence)
    const details = isPresent
      ? {
          sourceHtml: extractHtml(element),
          snippet: extractSnippet(cardType || '(empty)'),
          domPath: getDomPath(element),
          cardType,
          isValidType,
          validCardTypes: VALID_CARD_TYPES,
        }
      : { validCardTypes: VALID_CARD_TYPES }

    return {
      label: LABEL,
      name: NAME,
      message,
      type,
      priority,
      details,
    }
  },
}

