import type { DisplayField } from '@/shared/presentation/schema'

import type { Check } from './checks.shared'
import { ABSENCE, MAX_DETAIL_KEY, MAX_OVERVIEW_KEY, text } from './checks.shared'

const REPLACED_KEYS = new Set([
  'Page URL', 'Normalized page URL', 'Document URL', 'Compared URL (page URL)', 'Original URL', 'Requested page URL', 'Base URL',
  'Final navigation URL', 'Normalized final URL', 'First navigation URL',
  'Resolved canonical URL', 'Canonical href (observed)', 'HTML canonical', 'Normalized canonical URL', 'Canonical URL used for comparison', 'Declared canonical href',
  'HTTP Link header (raw)', 'Link header rel=canonical',
  'Navigation comparison', 'Self-reference', 'Cluster status', 'Conflict', 'Self-reference comparison',
  'Probe failure', 'Probe failed', 'Findings',
])
const BANNED_ABSENCE = new Set(['Missing', 'Unknown', 'Unavailable', 'Unreachable'])
const evidenceFields = (records: { fields: DisplayField[] }[]) => records.flatMap((record) => record.fields)

const keyLength: Check = {
  id: 'F8', title: `Overview keys at most ${MAX_OVERVIEW_KEY} characters, detail keys at most ${MAX_DETAIL_KEY}`,
  run: (view) => [
    ...view.values.filter((field) => field.kind !== 'original' && field.key.length > MAX_OVERVIEW_KEY).map((field) => `overview key "${field.key}" (${field.key.length})`),
    ...[...view.detailValues, ...view.checked, ...evidenceFields(view.evidence)].filter((field) => field.kind !== 'original' && field.key.length > MAX_DETAIL_KEY).map((field) => `detail key "${field.key}" (${field.key.length})`),
  ],
}

const urlFields: Check = {
  id: 'F9', title: 'URLs are url fields; a text value never embeds a URL',
  run: (view) => [...view.values, ...view.detailValues, ...evidenceFields(view.evidence)].flatMap((field) => {
    if (field.kind === 'text' && /https?:\/\//i.test(text(field))) return [`"${field.key}" embeds a URL in text`]
    if (field.kind !== 'url') return []
    const value = text(field)
    let valid = false
    try { valid = /^https?:$/.test(new URL(value, view.pageUrl).protocol) } catch { valid = false }
    return !value || /\s/.test(value) || ABSENCE.has(value) || !valid ? [`url field "${field.key}" holds "${value}"`] : []
  }),
}

const facts: Check = {
  id: 'F10', title: 'Values are facts, not sentences',
  run: (view) => {
    const out: string[] = []
    for (const field of view.values) {
      if (field.kind !== 'text') continue
      const value = text(field)
      if (value.length > 60) out.push(`overview "${field.key}" is ${value.length} characters`)
      if (value.includes('. ')) out.push(`overview "${field.key}" is a sentence`)
      if (/\([^)]{13,}\)/.test(value)) out.push(`overview "${field.key}" carries a parenthesised explanation`)
    }
    for (const field of view.detailValues) if (field.kind === 'text' && text(field).length > 120) out.push(`detail "${field.key}" is ${text(field).length} characters`)
    for (const field of evidenceFields(view.evidence)) if (field.kind === 'text' && text(field).length > 160) out.push(`evidence "${field.key}" is ${text(field).length} characters`)
    return out
  },
}

const vocabulary: Check = {
  id: 'F11', title: 'One vocabulary across all rules',
  run: (view) => {
    const out: string[] = []
    const all = [...view.values, ...view.detailValues, ...view.checked, ...evidenceFields(view.evidence)]
    for (const field of all) {
      if (REPLACED_KEYS.has(field.key)) out.push(`replaced key "${field.key}"`)
      if (/\((observed|trimmed|raw|reconstructed|first \d+ characters)\)$/i.test(field.key)) out.push(`banned suffix in "${field.key}"`)
      if (field.kind === 'original' || view.checked.includes(field)) continue
      const value = text(field)
      if ((/^Not /.test(value) && !ABSENCE.has(value)) || BANNED_ABSENCE.has(value)) out.push(`absence word "${value}" ("${field.key}")`)
    }
    const href = view.values.find((field) => field.key === 'Canonical href')
    const canonical = view.values.find((field) => field.key === 'Canonical URL')
    // The raw href is redundant only when it already is the absolute Canonical URL (a relative href stays).
    if (href && canonical && text(href) === text(canonical)) out.push('Canonical href shown although it equals Canonical URL')
    return out
  },
}

const observedValue: Check = {
  id: 'F12', title: 'The overview carries an observed value, never only a count',
  run: (view) => {
    if (!view.markup.length && !view.evidence.length) return []
    const observed = view.values.some((field) => field.kind === 'url' || field.kind === 'original'
      || (field.kind === 'text' && typeof field.value === 'string' && !/^\d+$/.test(field.value) && !ABSENCE.has(field.value) && !/^(Yes|No)$/.test(field.value)))
    return observed ? [] : [`overview shows only counts/absence (${view.values.map((field) => field.key).join(', ')})`]
  },
}

const unavailable: Check = {
  id: 'F13', title: 'Unavailable input is declared once, as the checked input',
  run: (view, run) => {
    const out: string[] = []
    const notCaptured = view.values.filter((field) => text(field) === 'Not captured').length
    if ((view.input === 'Not captured') !== (notCaptured === 1)) out.push(`checked input "${view.input}" with ${notCaptured} "Not captured" row(s)`)
    if (view.values.some((field) => field.key === 'Applicable')) out.push('"Applicable" row')
    if (run.result.type === 'not_applicable' && !view.values.some((field) => text(field) === 'Not checked')) out.push('not applicable without a "Not checked" row')
    return out
  },
}

const noRepeat: Check = {
  id: 'F14', title: 'Details never repeat the overview',
  run: (view) => {
    const values = new Set(view.values.map(text).filter((value) => value.length >= 4 && !/^\d+$/.test(value)))
    const keys = new Set(view.values.map((field) => field.key))
    return [
      ...view.detailValues.filter((field) => values.has(text(field))).map((field) => `detail "${field.key}" repeats an overview value`),
      ...view.checked.filter((field) => keys.has(field.key)).map((field) => `checked key "${field.key}" repeats an overview key`),
    ]
  },
}

export const VOCABULARY_CHECKS: Check[] = [keyLength, urlFields, facts, vocabulary, observedValue, unavailable, noRepeat]
