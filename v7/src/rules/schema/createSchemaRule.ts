import { entityFields, matchOverview } from './createSchemaRule.evidence'
import type { Checked } from './createSchemaRule.evidence'

import type { Rule, RuleMeta } from '@/core/types'
import { parseLdDetails, findType } from '@/shared/structured'
import { textField, urlField } from '@/shared/presentation/create'
import { listRow } from '@/shared/presentation/listRow'
import { presentResult } from '@/shared/presentation/result'
import { LD_SELECTOR, declaredTypes, ldScriptRecords, parseErrorRow } from '@/shared/structuredRecords'

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

/**
 * Factory function to create schema rules (ZERO-POINT DRY pattern).
 * Every rule built from this factory is migrated together in this one file.
 * Card layout (FORMATTING.md): `Types` = every @type the page declares, the matched entity or the
 * match count, `Missing fields` as the field-check verdict, parse errors by script number, then the
 * original <script> blocks when short; details carry the four count rows and one record per script
 * whose fields include every matching entity.
 */
export function createSchemaRule(config: SchemaRuleConfig): Rule {
  const types = Array.isArray(config.types) ? config.types : [config.types]
  const fieldsLabel = config.fieldsLabel || 'required'
  const presenceOnly = Boolean(config.presenceOnly)
  const tested = presenceOnly
    ? `Checked JSON-LD presence for ${types.join(', ')}; fields were not validated.`
    : `Checked every matching JSON-LD entity for the listed ${fieldsLabel} fields; this is not full semantic validation.`
  const matchedType = (node: Record<string, unknown>) => types.find((type) => findType([node], type).length) || types[0]!
  const checked = [
    textField('Selector', LD_SELECTOR), textField('Types checked', types.join(', ')),
    textField('Criterion', tested), textField('Entity fields', presenceOnly ? 'Not validated' : `${fieldsLabel} fields`),
    ...(config.deprecated ? [textField('Applicable condition', config.deprecated)] : []),
  ]
  // A retired feature's announcement is a clickable detail row, not an evidence record (F6, F12).
  const deprecationRow = config.reference ? [urlField('Deprecation notice', config.reference)] : []

  const rule: Rule = {
    id: config.id, name: config.name, presentation: 1, enabled: true, what: 'static', meta: config.meta,
    async run(page) {
      const parsed = parseLdDetails(page.doc)
      const matches = parsed.entries.filter(({ node }) => types.some((type) => findType([node], type).length))
      const checks: Checked[] = matches.map((entry) => {
        const result = config.validator(entry.node)
        return { ...entry, validation: typeof result === 'boolean' ? { ok: result } : result }
      })
      const entities = entityFields(checks, matchedType, presenceOnly)
      const scripts = ldScriptRecords(page.doc, parsed, entities.fields)
      const typesRow = scripts.total ? [textField('Types', listRow(declaredTypes(parsed)))] : []
      const base = { input: 'Idle DOM' as const, checked, markup: scripts.markup, evidence: scripts.evidence }

      if (!matches.length) return presentResult(rule, page, {
        ...base, type: parsed.errorCount ? 'warn' : 'info', priority: 920,
        values: [...typesRow, textField(scripts.total ? types[0]! : 'JSON-LD scripts', 'Not found'), ...parseErrorRow(parsed), ...scripts.overviewMarkup],
        detailValues: [...scripts.counts, ...deprecationRow],
        noMarkup: scripts.total ? `No matching ${types[0]} JSON-LD entities found` : 'No JSON-LD scripts found',
      })

      const failures = checks.filter(({ validation }) => !validation.ok)
      const failType = failures.some(({ validation }) => (validation.failType || 'warn') === 'warn') ? 'warn' : 'info'
      const type = parsed.errorCount ? 'warn' : config.deprecated ? 'info' : failures.length ? failType : 'ok'
      return presentResult(rule, page, {
        ...base, type, priority: type === 'warn' ? 250 : 800,
        values: [...typesRow, ...matchOverview(checks, matchedType, presenceOnly), ...parseErrorRow(parsed), ...scripts.overviewMarkup],
        detailValues: [...scripts.counts,
          ...(checks.length > 1 && failures.length ? [textField('Entities with issues', failures.length)] : []),
          ...(entities.shown < checks.length ? [textField('Entities shown', `${entities.shown} of ${checks.length}`)] : []), ...deprecationRow],
        noMarkup: 'Complete original JSON-LD scripts not retained',
      })
    },
  }
  return rule
}
