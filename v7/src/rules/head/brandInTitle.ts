import type { Rule } from '@/core/types'
import { extractHtml, extractSnippet, getDomPath } from '@/shared/html-utils'

// Constants
const LABEL = 'HEAD'
const NAME = 'Brand in Title'
const RULE_ID = 'head:brand-in-title'
const SELECTOR = 'head > title'
const SPEC = 'https://developers.google.com/search/docs/appearance/title-link'

export const brandInTitleRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'static',
  async run(page, ctx) {
    // 1. Extract brand from configuration (user-defined variable)
    const variables = (ctx.globals as { variables?: Record<string, unknown> }).variables || {}
    const brand = String((variables as Record<string, unknown>)['brand'] || '').trim()

    // 2. Check if brand is configured
    if (!brand) {
      return {
        label: LABEL,
        name: NAME,
        message: 'Brand not configured. Set "brand" variable in settings to check if brand appears in title.',
        type: 'warn',
        priority: 850,
        details: { reference: SPEC },
      }
    }

    // 3. Query title element
    const element = page.doc.querySelector(SELECTOR)
    const titleText = (element?.textContent || '').trim()

    // 4. Determine states (Binary Logic)
    const isTitleMissing = !element || titleText.length === 0
    const hasBrand = titleText.toLowerCase().includes(brand.toLowerCase())

    // 5. Build message (Quantified, showing the value)
    let message = ''
    if (isTitleMissing) {
      message = `Missing <title> tag. Cannot check brand "${extractSnippet(brand, 20)}".`
    } else if (hasBrand) {
      message = `Title contains brand "${extractSnippet(brand, 20)}".`
    } else {
      message = `Title missing brand "${extractSnippet(brand, 20)}".`
    }

    // 6. Determine type
    const type = isTitleMissing ? 'info' : hasBrand ? 'ok' : 'warn'

    // 7. Build evidence (Chain of Evidence)
    const details = element
      ? {
          sourceHtml: extractHtml(element),
          snippet: extractSnippet(titleText || '(empty)'),
          domPath: getDomPath(element),
          title: titleText,
          brand,
          hasBrand,
          reference: SPEC,
        }
      : { brand, reference: SPEC }

    return {
      label: LABEL,
      name: NAME,
      message,
      type,
      priority: hasBrand ? 700 : isTitleMissing ? 900 : 400,
      details,
    }
  },
}
