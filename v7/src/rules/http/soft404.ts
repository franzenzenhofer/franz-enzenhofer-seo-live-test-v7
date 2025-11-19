import type { Rule } from '@/core/types'
import { extractSnippet } from '@/shared/html-utils'

const LABEL = 'HTTP'
const NAME = 'Soft 404 Detection'
const RULE_ID = 'http:soft-404'
const SPEC = 'https://developers.google.com/search/docs/crawling-indexing/http-network-errors'

const looksNotFound = (html: string) => /\b(404|not found|seite nicht gefunden|pagina no encontrada|página no encontrada|page introuvable)\b/i.test(html)

export const soft404Rule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'http',
  async run(page) {
    const status = page.status || 0
    const isSuccess = status >= 200 && status < 300
    if (!isSuccess) {
      return {
        label: LABEL,
        name: NAME,
        message: `HTTP ${status}: Skipping soft 404 check (status not 2xx)`,
        type: 'info',
        priority: 900,
        details: { httpHeaders: page.headers || {}, status, reference: SPEC },
      }
    }
    const hasSoft404Pattern = looksNotFound(page.html)
    const htmlSnippet = page.html.length > 1000 ? page.html.slice(0, 1000) : page.html
    let message = ''
    let type: 'ok' | 'warn' = 'ok'
    let priority = 800
    if (hasSoft404Pattern) {
      message = `Possible soft 404: HTTP ${status} but content suggests "not found"`
      type = 'warn'
      priority = 100
    } else {
      message = `HTTP ${status} with normal content. Not a soft 404.`
      type = 'ok'
      priority = 850
    }
    return {
      label: LABEL,
      name: NAME,
      message,
      type,
      priority,
      details: {
        httpHeaders: page.headers || {},
        snippet: extractSnippet(htmlSnippet, 200),
        status,
        hasSoft404Pattern,
        htmlLength: page.html.length,
        reference: SPEC,
      },
    }
  },
}

