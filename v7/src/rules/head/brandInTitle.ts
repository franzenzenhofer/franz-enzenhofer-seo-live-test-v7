import type { Rule } from '@/core/types'
import { extractHtml, extractSnippet, getDomPath } from '@/shared/html-utils'

export const brandInTitleRule: Rule = {
  id: 'head:brand-in-title',
  name: 'Brand in Title',
  enabled: true,
  what: 'static',
  async run(page, ctx) {
    const v = (ctx.globals as { variables?: Record<string, unknown> }).variables || {}
    const brand = String((v as Record<string, unknown>)['brand'] || '').trim()
    if (!brand) return { name: 'Brand in Title', label: 'HEAD', message: 'Brand not configured', type: 'info' }
    const titleEl = page.doc.querySelector('head > title')
    const t = titleEl?.textContent || ''
    const sourceHtml = titleEl ? extractHtml(titleEl) : ''
    const hasBrand = t.toLowerCase().includes(brand.toLowerCase())
    return {
      name: 'Brand in Title',
      label: 'HEAD',
      message: hasBrand ? 'Title contains brand' : 'Title missing brand',
      type: hasBrand ? 'ok' : 'warn',
      details: titleEl
        ? {
            sourceHtml,
            snippet: extractSnippet(sourceHtml),
            domPath: getDomPath(titleEl),
          }
        : undefined,
    }
  },
}
