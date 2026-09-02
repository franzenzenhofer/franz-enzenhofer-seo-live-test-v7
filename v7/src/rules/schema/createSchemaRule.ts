import type { Rule, RuleMeta } from '@/core/types'
import { parseLd, findType } from '@/shared/structured'
import { extractHtml, extractSnippet } from '@/shared/html-utils'
import { getDomPath } from '@/shared/dom-path'

/**
 * Validation result with optional missing fields reporting
 */
export type SchemaValidationResult = {
  ok: boolean
  missing?: string[]
  failType?: 'info' | 'warn'    // severity when ok is false (default 'warn')
  fieldsLabel?: string          // e.g. 'recommended' when the checked set is not spec-required
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
  meta: RuleMeta                // provenance + spec references (injected into every result by the runner)
  searchStrings?: string[]      // Optional: custom strings to search for in script tags
  fieldsLabel?: string          // Optional: default label for the checked field set (default 'required')
  deprecated?: string           // Optional: Google retired the feature - every found-branch result is info + this note
  reference?: string            // Optional: details.reference override when it must differ from meta.references[0]
}

/**
 * Factory function to create schema rules (ZERO-POINT DRY pattern)
 * Eliminates ~350 lines of duplicate logic across 10 schema rules
 */
export function createSchemaRule(config: SchemaRuleConfig): Rule {
  const types = Array.isArray(config.types) ? config.types : [config.types]
  const typesLower = types.map(t => t.toLowerCase())
  const searchStrings = config.searchStrings || types
  const tested = `Parsed LD+JSON scripts, matched type(s): ${types.join(', ')}, and validated ${config.fieldsLabel || 'required'} fields.`
  const extras = {
    ...(config.reference ? { reference: config.reference } : {}),
    ...(config.deprecated ? { note: config.deprecated } : {}),
  }

  return {
    id: config.id,
    name: config.name,
    enabled: true,
    what: 'static',
    meta: config.meta,
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
          message: `No ${types[0]} JSON-LD`,
          type: 'info',
          priority: 920,
          name: config.name,
          details: { tested, types, ...extras },
        }
      }

      // Run validation
      const result = config.validator(n)
      const validation: SchemaValidationResult = typeof result === 'boolean'
        ? { ok: result }
        : result

      // Find the script tag containing this schema
      let script: Element | null = null
      for (let index = 0; index < scripts.length; index++) {
        const candidate = scripts.item(index)
        if (!candidate) continue
        if (!searchStrings.some((value) => candidate.textContent?.includes(value))) continue
        script = candidate
        break
      }
      const sourceHtml = extractHtml(script)

      // Build message around the type actually found on the page.
      const rawType = n['@type']
      const foundType = typeof rawType === 'string' && rawType.trim() ? rawType.trim() : types[0]
      const fieldsLabel = validation.fieldsLabel || config.fieldsLabel || 'required'
      let message: string
      if (validation.ok) {
        message = `${foundType} structured data found and ${fieldsLabel} fields present.`
      } else if (validation.missing && validation.missing.length > 0) {
        message = `${foundType} missing: ${validation.missing.join(', ')}`
      } else {
        message = `${foundType} missing ${fieldsLabel} fields.`
      }
      if (config.deprecated) message = `${message} ${config.deprecated}`

      const failType = validation.failType || 'warn'
      const type = config.deprecated ? 'info' : validation.ok ? 'ok' : failType
      const priority = validation.ok ? 800 : failType === 'info' || config.deprecated ? 900 : 250
      const baseDetails = {
        tested,
        types,
        foundType,
        ...extras,
        ...(validation.missing?.length ? { missing: validation.missing } : {}),
      }

      return {
        label: 'SCHEMA',
        message,
        type,
        priority,
        name: config.name,
        details: script
          ? { sourceHtml, snippet: extractSnippet(sourceHtml), domPath: getDomPath(script), ...baseDetails }
          : baseDetails,
      }
    },
  }
}
