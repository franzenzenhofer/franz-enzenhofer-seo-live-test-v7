import type { Rule } from '@/core/types'

const looksNotFound = (html: string) => /\b(404|not found|seite nicht gefunden|pagina no encontrada)\b/i.test(html)

export const soft404Rule: Rule = {
  id: 'http:soft-404',
  name: 'Soft 404 check',
  enabled: true,
  async run(page) {
    const s = page.status
    if (!s || s >= 400) return { label: 'HTTP', message: 'Status not 2xx, skipping soft 404', type: 'info' }
    const bad = looksNotFound(page.html)
    return bad ? { label: 'HTTP', message: 'Possible soft 404: page looks not found but status is 2xx', type: 'warn' } : { label: 'HTTP', message: 'Not a soft 404', type: 'ok' }
  },
}

