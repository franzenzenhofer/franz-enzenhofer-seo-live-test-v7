import type { Rule } from '@/core/types'
import { parseLd, findType, docs } from '@/shared/structured'
import { extractHtml, extractSnippet, getDomPath } from '@/shared/html-utils'

/**
 * Validation result with optional missing fields reporting
 */
export type SchemaValidationResult = {
  ok: boolean
  missing?: string[]
}

/**
 * Validator function that checks schema data and returns validation result
 */
export type SchemaValidator = (data: Record<string, unknown>) => SchemaValidationResult | boolean

/**
 * Configuration for creating a schema rule
 */
export interface SchemaRuleConfig {
  id: string                    // e.g., 'schema:recipe' or 'schema:article:required'
  name: string                  // e.g., 'Schema Recipe'
  types: string | string[]      // Schema.org type(s) to match (e.g., 'Recipe' or ['Article', 'NewsArticle'])
  validator: SchemaValidator
  searchStrings?: string[]      // Optional: custom strings to search for in script tags
}

/**
 * Factory function to create schema rules (ZERO-POINT DRY pattern)
 * Eliminates ~350 lines of duplicate logic across 10 schema rules
 */
export function createSchemaRule(config: SchemaRuleConfig): Rule {
  const types = Array.isArray(config.types) ? config.types : [config.types]
  const typesLower = types.map(t => t.toLowerCase())
  const searchStrings = config.searchStrings || types

  return {
    id: config.id,
    name: config.name,
    enabled: true,
    what: 'static',
    async run(page) {
      const scripts = page.doc.querySelectorAll('script[type="application/ld+json"]')
      const nodes = parseLd(page.doc)

      // Find first matching node across all supported types
      let n: Record<string, unknown> | undefined
      for (const typeL of typesLower) {
        const found = findType(nodes, typeL)[0]
        if (found) {
          n = found
          break
        }
      }

      if (!n) {
        return {
          label: 'SCHEMA',
          message: `No ${types[0]} JSON‑LD`,
          type: 'info',
          name: config.name,
        }
      }

      // Run validation
      const result = config.validator(n)
      const validation: SchemaValidationResult = typeof result === 'boolean'
        ? { ok: result }
        : result

      // Find the script tag containing this schema
      const script = Array.from(scripts).find((s) =>
        searchStrings.some(str => s.textContent?.includes(str))
      ) || null
      const sourceHtml = extractHtml(script)

      // Build message
      const docsUrl = docs(typesLower[0]!)
      let message: string
      if (validation.ok) {
        message = `${types[0]} OK · Docs: ${docsUrl}`
      } else if (validation.missing && validation.missing.length > 0) {
        message = `${types[0]} missing: ${validation.missing.join(', ')} · Docs: ${docsUrl}`
      } else {
        message = `${types[0]} missing fields · Docs: ${docsUrl}`
      }

      return {
        label: 'SCHEMA',
        message,
        type: validation.ok ? 'ok' : 'warn',
        name: config.name,
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
