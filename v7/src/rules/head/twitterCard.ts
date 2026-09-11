import type { Rule } from '@/core/types'
import { textField } from '@/shared/presentation/create'
import { markupEvidence } from '@/shared/presentation/originalMarkup'
import { presentResult } from '@/shared/presentation/result'

const NAME = 'Twitter Card'
const RULE_ID = 'head:twitter-card'
const SELECTOR = 'head > meta[name="twitter:card" i]'

// Valid Twitter Card types per spec
const VALID_CARD_TYPES = ['summary', 'summary_large_image', 'app', 'player']

const checked = [
  textField('Selector', SELECTOR), textField('Selection', 'First match'), textField('Attribute', 'content'),
  textField('Valid card types', VALID_CARD_TYPES.join(', ')), textField('Criterion', 'Content matches a supported card type'),
]

export const twitterCardRule: Rule = {
  id: RULE_ID,
  name: NAME,
  presentation: 1,
  enabled: true,
  what: 'static',
  meta: {
    userGuide: {
      check: "Checks whether the declared X/Twitter card type matches the supported names in this rule. It does not fetch a preview or validate all image, app or player requirements.",
      action: "For a standard link preview, set twitter:card to summary or summary_large_image in the page head and configure the corresponding preview metadata. Use app or player only with their required supporting fields.",
    },
    provenance: 'general',
    references: ['https://web.archive.org/web/20240526100043/https://developer.x.com/en/docs/twitter-for-websites/cards/overview/markup'],
    description: 'Checks meta[name=twitter:card] presence and validates its value against {summary, summary_large_image, app, player}.',
  },
  async run(page) {
    const element = page.doc.querySelector(SELECTOR)
    if (!element) return presentResult(twitterCardRule, page, {
      input: 'Static DOM', type: 'info', priority: 900,
      values: [textField('twitter:card', 'Not found')], checked,
      noMarkup: 'No matching twitter:card meta element found',
    })

    const cardType = (element.getAttribute('content') || '').trim()
    const captured = markupEvidence([element], 'Twitter card markup')
    const common = {
      input: 'Static DOM',
      evidence: captured.fields.length ? [{ name: 'Source locations', fields: captured.fields }] : [],
      markup: captured.markup, noMarkup: 'Complete original twitter:card markup not retained',
    }
    if (!cardType) return presentResult(twitterCardRule, page, { ...common, type: 'warn', priority: 500,
      values: [textField('twitter:card', 'Empty')], checked })

    const isValidType = VALID_CARD_TYPES.includes(cardType)
    return presentResult(twitterCardRule, page, { ...common, type: isValidType ? 'ok' : 'warn', priority: isValidType ? 750 : 400,
      values: [textField('twitter:card', cardType), textField('Card type valid', isValidType ? 'Yes' : 'No')], checked })
  },
}
