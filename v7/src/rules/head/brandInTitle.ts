import type { Rule } from '@/core/types'
import { extractHtml, extractSnippet } from '@/shared/html-utils'
import { getDomPath } from '@/shared/dom-path'

// Constants
const LABEL = 'HEAD'
const NAME = 'Brand in Title'
const RULE_ID = 'head:brand-in-title'
const SELECTOR = 'head > title'
const SPEC = 'https://developers.google.com/search/docs/appearance/title-link'

const inferBrandFromUrl = (url: string): { brand: string; host: string } => {
  try {
    const { hostname } = new URL(url || '')
    const host = hostname.replace(/^www\./, '')
    const parts = host.split('.').filter(Boolean)
    const brand = parts.reduce((longest, part) => (part.length > longest.length ? part : longest), '')
    return { brand, host }
  } catch {
    return { brand: '', host: '' }
  }
}

export const brandInTitleRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'static',
  async run(page, ctx) {
    // 1. Extract brand from configuration (user-defined variable) or infer from hostname
    const variables = (ctx.globals as { variables?: Record<string, unknown> }).variables || {}
    const configuredBrand = String((variables as Record<string, unknown>)['brand'] || '').trim()
    const { brand: inferredBrand, host } = inferBrandFromUrl(page.url || '')
    const brand = configuredBrand || inferredBrand
    const brandSource = configuredBrand ? 'configured' : inferredBrand ? 'hostname' : 'unknown'

    if (!brand) {
      return {
        label: LABEL,
        name: NAME,
        message: 'Could not determine brand; set "brand" in settings.',
        type: 'info',
        priority: 900,
        details: { reference: SPEC, brandSource, host },
      }
    }

    // 3. Query title element
    const element = page.doc.querySelector(SELECTOR)
    const titleText = (element?.textContent || '').trim()

    // 4. Determine states (Binary Logic)
    const isTitleMissing = !element || titleText.length === 0
    const hasBrand = titleText.toLowerCase().includes(brand.toLowerCase())

    const message = isTitleMissing
      ? `Missing <title> tag. Cannot check brand "${extractSnippet(brand, 20)}".`
      : hasBrand
        ? `Title contains brand "${extractSnippet(brand, 20)}".`
        : `Meta-Title does not include the brand "${brand}".`

    const type: 'info' | 'warn' = hasBrand && !isTitleMissing ? 'info' : 'warn'

    const details = element
      ? {
          sourceHtml: extractHtml(element),
          snippet: extractSnippet(titleText || '(empty)'),
          domPath: getDomPath(element),
          title: titleText,
          brand,
          hasBrand,
          brandSource,
          host,
          reference: SPEC,
        }
      : { brand, brandSource, host, reference: SPEC }

    return {
      label: LABEL,
      name: NAME,
      message,
      type,
      priority: hasBrand ? 700 : 300,
      details,
    }
  },
}
