import type { Rule } from '@/core/types'

export const brandInTitleRule: Rule = {
  id: 'head:brand-in-title',
  name: 'Brand in Title',
  enabled: true,
  async run(page, ctx) {
    const v = (ctx.globals as { variables?: Record<string, unknown> }).variables || {}
    const brand = String((v as Record<string, unknown>)['brand'] || '').trim()
    if (!brand) return { label: 'HEAD', message: 'Brand not configured', type: 'info' }
    const t = page.doc.querySelector('head > title')?.textContent || ''
    return t.toLowerCase().includes(brand.toLowerCase())
      ? { label: 'HEAD', message: 'Title contains brand', type: 'ok' }
      : { label: 'HEAD', message: 'Title missing brand', type: 'warn' }
  },
}
