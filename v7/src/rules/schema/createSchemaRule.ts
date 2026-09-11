import { entityEvidence, errorEvidence } from './createSchemaRule.evidence'

import type { Rule, RuleMeta } from '@/core/types'
import { parseLdDetails, findType } from '@/shared/structured'
import { sampleElements } from '@/shared/domEvidence'
import { textField, urlField } from '@/shared/presentation/create'
import { markupEvidence } from '@/shared/presentation/originalMarkup'
import { presentResult } from '@/shared/presentation/result'

/** Validation result with optional missing-fields reporting. */
export type SchemaValidationResult = {
  ok: boolean
  missing?: string[]
  failType?: 'info' | 'warn'    // severity when ok is false (default 'warn')
  fieldsLabel?: string          // e.g. 'recommended' when the checked set is not spec-required
}

export type SchemaValidator = (data: Record<string, unknown>) => SchemaValidationResult | boolean

export interface SchemaRuleConfig {
  id: string
  name: string
  types: string | string[]
  validator: SchemaValidator
  meta: RuleMeta
  searchStrings?: string[]      // unused by the runner; retained for config-shape compatibility
  fieldsLabel?: string          // default label for the checked field set (default 'required')
  presenceOnly?: boolean
  deprecated?: string           // Google retired the feature - every found-branch result is info + this note
  reference?: string            // extra documentation URL when it must differ from meta.references[0]
}

const SELECTOR = 'script[type="application/ld+json"]'

/**
 * Factory function to create schema rules (ZERO-POINT DRY pattern).
 * Every rule built from this factory is migrated together in this one file.
 */
export function createSchemaRule(config: SchemaRuleConfig): Rule {
  const types = Array.isArray(config.types) ? config.types : [config.types]
  const fieldsLabel = config.fieldsLabel || 'required'
  const tested = config.presenceOnly
    ? `Checked JSON-LD presence for ${types.join(', ')}; fields were not validated.`
    : `Checked every matching JSON-LD entity for the listed ${fieldsLabel} fields; this is not full semantic validation.`
  const rule: Rule = {
    id: config.id, name: config.name, presentation: 1, enabled: true, what: 'static', meta: config.meta,
    async run(page) {
      const parsed = parseLdDetails(page.doc)
      const matches = parsed.entries.filter(({ node }) => types.some((type) => findType([node], type).length))
      const { sample, total } = sampleElements(page.doc.querySelectorAll(SELECTOR))
      const captured = markupEvidence(sample, 'JSON-LD script')
      const checked = [
        textField('Selector', SELECTOR), textField('Types checked', types.join(', ')),
        textField('Criterion', tested), textField('Entity fields', config.presenceOnly ? 'Not validated' : `${fieldsLabel} fields`),
        ...(config.deprecated ? [textField('Applicable condition', config.deprecated)] : []),
      ]
      const errors = errorEvidence(parsed.errors)
      const captureFields = [textField('Scripts retained', sample.length), textField('Scripts omitted', total - sample.length),
        textField('Parse errors omitted', parsed.errorCount - parsed.errors.length), ...captured.fields]
      const detailValues = [textField('Scripts checked', parsed.scriptCount)]
      const deprecationEvidence = config.reference ? [{ name: 'Deprecation announcement', fields: [urlField('URL', config.reference)] }] : []

      if (!matches.length) return presentResult(rule, page, {
        input: 'Idle DOM', type: parsed.errorCount ? 'warn' : 'info', priority: 920,
        values: [textField('Matching entities', 0), textField('JSON-LD parse errors', parsed.errorCount)],
        detailValues, checked, evidence: [...errors, ...deprecationEvidence, { name: 'Capture', fields: captureFields }],
        markup: captured.markup, noMarkup: total ? `No matching ${types[0]} JSON-LD entities found` : 'No JSON-LD scripts found',
      })

      const checks = matches.map((entry) => {
        const result = config.validator(entry.node)
        return { ...entry, validation: (typeof result === 'boolean' ? { ok: result } : result) as SchemaValidationResult }
      })
      const failures = checks.filter(({ validation }) => !validation.ok)
      const failType = failures.some(({ validation }) => (validation.failType || 'warn') === 'warn') ? 'warn' : 'info'
      const type = parsed.errorCount ? 'warn' : config.deprecated ? 'info' : failures.length ? failType : 'ok'
      const { records, omitted } = entityEvidence(checks, types[0]!, Boolean(config.presenceOnly), fieldsLabel)
      return presentResult(rule, page, {
        input: 'Idle DOM', type, priority: type === 'warn' ? 250 : 800,
        values: [textField('Matching entities', matches.length),
          ...(config.presenceOnly ? [] : [textField('Entities with field issues', failures.length)]),
          textField('JSON-LD parse errors', parsed.errorCount)],
        detailValues, checked,
        evidence: [...records, ...errors, ...deprecationEvidence, { name: 'Capture', fields: [...captureFields, textField('Entities omitted', omitted)] }],
        markup: captured.markup, noMarkup: 'Complete original JSON-LD scripts not retained',
      })
    },
  }
  return rule
}
