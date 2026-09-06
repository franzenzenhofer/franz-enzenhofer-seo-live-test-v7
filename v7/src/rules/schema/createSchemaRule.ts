import type { Rule, RuleMeta } from '@/core/types'
import { parseLdDetails, findType } from '@/shared/structured'
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
  presenceOnly?: boolean
  deprecated?: string           // Optional: Google retired the feature - every found-branch result is info + this note
  reference?: string            // Optional: details.reference override when it must differ from meta.references[0]
}

/**
 * Factory function to create schema rules (ZERO-POINT DRY pattern)
 * Eliminates ~350 lines of duplicate logic across 10 schema rules
 */
export function createSchemaRule(config: SchemaRuleConfig): Rule {
  const types = Array.isArray(config.types) ? config.types : [config.types]
  const tested = config.presenceOnly ? `Checked JSON-LD presence for ${types.join(', ')}; fields were not validated.`
    : `Checked every matching JSON-LD entity for the listed ${config.fieldsLabel || 'required'} fields; this is not full semantic validation.`
  return {
    id: config.id, name: config.name, enabled: true, what: 'static', meta: config.meta,
    async run(page) {
      const parsed = parseLdDetails(page.doc)
      const matches = parsed.entries.filter(({ node }) => types.some((type) => findType([node], type).length))
      const extras = { tested, types, parseErrorCount: parsed.errorCount,
        ...(config.reference ? { reference: config.reference } : {}),
        ...(config.deprecated ? { note: config.deprecated } : {}) }
      if (!matches.length) return {
        label: 'SCHEMA', name: config.name, type: 'info', priority: 920,
        message: `No ${types[0]} JSON-LD${parsed.errorCount ? ' identified in successfully parsed blocks' : ''}`,
        details: { ...extras, parseErrors: parsed.errors },
      }
      const checks = matches.map((entry) => {
        const result = config.validator(entry.node)
        const validation: SchemaValidationResult = typeof result === 'boolean' ? { ok: result } : result
        return { ...entry, validation }
      })
      const failures = checks.filter(({ validation }) => !validation.ok)
      const selected = failures[0] || checks[0]!
      const validation = selected.validation
      const foundType = String(selected.node['@type'] || types[0])
      const fieldsLabel = validation.fieldsLabel || config.fieldsLabel || 'required'
      let message = config.presenceOnly ? `${foundType} structured data present (presence check only).`
        : failures.length ? `${foundType} missing: ${validation.missing?.join(', ') || `${fieldsLabel} fields`}`
          : `${foundType} structured data found and ${fieldsLabel} fields present.`
      if (checks.length > 1) message += ` Checked ${checks.length} entities; ${failures.length} with field issues.`
      if (config.deprecated) message += ` ${config.deprecated}`
      const failType = failures.some(({ validation: v }) => (v.failType || 'warn') === 'warn') ? 'warn' : 'info'
      const type = config.deprecated ? 'info' : failures.length ? failType : 'ok'
      const sourceHtml = extractHtml(selected.script)
      return {
        label: 'SCHEMA', name: config.name, message, type, priority: type === 'warn' ? 250 : 800,
        details: { ...extras, foundType, sourceHtml, snippet: extractSnippet(sourceHtml), domPath: getDomPath(selected.script),
          ...(validation.missing?.length ? { missing: validation.missing } : {}),
          entityCount: matches.length, issueCount: failures.length,
          entityIssues: failures.slice(0, 10).map(({ node, scriptIndex, validation: v }) => ({ scriptIndex, id: node['@id'], missing: v.missing })),
          issuesTruncated: failures.length > 10 },
      }
    },
  }
}
