import type { Rule } from '@/core/types'

const pick = (h: Record<string,string>|undefined, k: string) => (h?.[k.toLowerCase()] || '')

export const hasHeaderRule: Rule = {
  id: 'http:has-header',
  name: 'HTTP has header (configurable)',
  enabled: true,
  what: 'http',
  async run(page, ctx) {
    const vars = (ctx.globals as { variables?: Record<string, unknown> }).variables || {}
    const raw = String((vars as Record<string, unknown>)['http_has_header'] || '').trim()
    if (!raw)
      return {
        label: 'HTTP',
        message: 'No header configured (set variables.http_has_header)',
        type: 'info',
        name: 'HTTP has header (configurable)',
        details: { httpHeaders: page.headers || {} },
      }
    const keys = raw.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
    const miss = keys.filter((k) => !pick(page.headers, k))
    return {
      label: 'HTTP',
      message: miss.length ? `Missing headers: ${miss.join(', ')}` : `All headers present: ${keys.join(', ')}`,
      type: miss.length ? 'warn' : 'ok',
      name: 'HTTP has header (configurable)',
      details: { httpHeaders: page.headers || {} },
    }
  },
}
