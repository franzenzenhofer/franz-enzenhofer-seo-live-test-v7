import type { Rule } from '@/core/types'
import { parseLd, findType, docs } from '@/shared/structured'
import { extractHtml, extractSnippet, getDomPath } from '@/shared/html-utils'

/**
 * Factory function to create schema rules (DRY pattern)
 * Reduces ~350 lines of duplicate code to ~50 lines
 */
export function createSchemaRule(
  type: string,
  displayName: string,
  validator: (data: Record<string, unknown>) => boolean
): Rule {
  const typeLower = type.toLowerCase()
  const typeCapitalized = type.charAt(0).toUpperCase() + type.slice(1)

  return {
    id: `schema:${typeLower}`,
    name: `Schema ${displayName}`,
    enabled: true,
    what: 'static',
    async run(page) {
      const scripts = page.doc.querySelectorAll('script[type="application/ld+json"]')
      const n = findType(parseLd(page.doc), typeLower)[0]

      if (!n) {
        return {
          label: 'SCHEMA',
          message: `No ${displayName} JSON‑LD`,
          type: 'info',
          name: `Schema ${displayName}`,
        }
      }

      const ok = validator(n)
      const script = Array.from(scripts).find((s) => s.textContent?.includes(typeCapitalized)) || null
      const sourceHtml = extractHtml(script)

      return {
        label: 'SCHEMA',
        message: ok
          ? `${displayName} OK · Docs: ${docs(typeLower)}`
          : `${displayName} missing fields · Docs: ${docs(typeLower)}`,
        type: ok ? 'ok' : 'warn',
        name: `Schema ${displayName}`,
        details: script
          ? {
              sourceHtml,
              snippet: extractSnippet(sourceHtml),
              domPath: getDomPath(script),
            }
          : undefined,
      }
    },
  }
}
