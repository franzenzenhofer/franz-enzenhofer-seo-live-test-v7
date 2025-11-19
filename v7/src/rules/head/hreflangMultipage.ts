import type { Rule } from '@/core/types'
import { extractHtmlFromList, extractSnippet } from '@/shared/html-utils'

// Constants
const LABEL = 'HEAD'
const NAME = 'Hreflang Multipage Validation'
const RULE_ID = 'head:hreflang-multipage'
const SELECTOR = 'head > link[rel="alternate"][hreflang]'
const SPEC = 'https://developers.google.com/search/docs/specialty/international/localized-versions'

export const hreflangMultipageRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'static',
  async run(page) {
    // 1. Query with precision selector
    const elements = Array.from(page.doc.querySelectorAll(SELECTOR))
    const count = elements.length

    // 2. Determine states (Binary Logic)
    const isPresent = count > 0

    if (!isPresent) {
      return {
        label: LABEL,
        name: NAME,
        message: 'No hreflang links found.',
        type: 'info',
        priority: 900,
        details: { reference: SPEC },
      }
    }

    // 3. Extract and normalize hreflang values (case-insensitive per spec)
    const hreflangValues = elements.map((el) => (el.getAttribute('hreflang') || '').trim().toLowerCase()).filter(Boolean)

    // 4. Detect issues
    const uniqueValues = new Set(hreflangValues)
    const hasDuplicates = hreflangValues.length !== uniqueValues.size
    const hasXDefault = hreflangValues.includes('x-default')

    // 5. Find duplicate entries if any
    const duplicates = hasDuplicates
      ? hreflangValues.filter((val, idx) => hreflangValues.indexOf(val) !== idx)
      : []
    const uniqueDuplicates = [...new Set(duplicates)]

    // 6. Build message (Quantified, showing the issue)
    let message = ''
    let type: 'ok' | 'warn' | 'info' = 'info'
    let priority = 500

    if (hasDuplicates) {
      message = `${count} hreflang links with ${uniqueDuplicates.length} duplicate values: ${uniqueDuplicates.join(', ')}`
      type = 'warn'
      priority = 200
    } else if (hasXDefault) {
      message = `${count} hreflang links with x-default. Validation: OK.`
      type = 'ok'
      priority = 700
    } else {
      message = `${count} hreflang links without x-default.`
      type = 'info'
      priority = 600
    }

    // 7. Build evidence (Chain of Evidence)
    const sourceHtml = extractHtmlFromList(elements)
    const domPaths = elements.map((_, idx) => (idx === 0 ? SELECTOR : `${SELECTOR}:nth-of-type(${idx + 1})`))

    return {
      label: LABEL,
      name: NAME,
      message,
      type,
      priority,
      details: {
        sourceHtml,
        snippet: extractSnippet(sourceHtml, 200),
        domPaths,
        count,
        hreflangValues,
        hasXDefault,
        hasDuplicates,
        duplicates: uniqueDuplicates,
        reference: SPEC,
      },
    }
  },
}

