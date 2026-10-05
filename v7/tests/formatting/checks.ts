import type { DisplayField } from '@/shared/presentation/schema'

import type { Check } from './checks.shared'
import { ABSENCE, isOriginal, text } from './checks.shared'
import { RECORD_CHECKS } from './checks.records'
import { VOCABULARY_CHECKS } from './checks.vocabulary'

// Mechanical checks of design/result-template/FORMATTING.md (F1-F14). F15 is manual review.
const VERDICT = /\b(differs?|different|matches|equals?|same|self-referenc\w*|aligns?|consistent|mismatch|conflict)/i
const TARGET_KEYS = new Set(['Current page URL', 'Final URL', 'Canonical URL', 'HTTP canonical', 'og:url'])

const order: Check = {
  id: 'F1', title: 'Overview order: observed value, comparison target, Comparison, original markup last',
  run: (view) => {
    const out: string[] = []
    const lastPlain = view.values.map(isOriginal).lastIndexOf(false)
    const firstOriginal = view.values.findIndex(isOriginal)
    if (firstOriginal >= 0 && firstOriginal < lastPlain) out.push(`original "${view.values[firstOriginal]!.key}" precedes plain row "${view.values[lastPlain]!.key}"`)
    const comparison = view.values.findIndex((field) => field.key === 'Comparison')
    if (comparison >= 0 && comparison !== lastPlain) out.push('Comparison is not the last plain row')
    const first = view.values[0]
    if (first && first.kind === 'text' && first.value === 1) out.push(`first row is a count of 1 ("${first.key}")`)
    return out
  },
}

const bothSides: Check = {
  id: 'F2', title: 'A comparison shows both sides and a closed verdict',
  run: (view) => {
    const comparison = view.values.find((field) => field.key === 'Comparison')
    const verdictRow = view.values.find((field) => field.kind === 'text' && VERDICT.test(text(field)))
    if (!comparison && !verdictRow) return []
    const urls = view.values.filter((field) => field.kind === 'url')
    const out: string[] = []
    if (urls.length < 2) out.push(`comparison ("${(comparison || verdictRow)!.key}: ${text((comparison || verdictRow)!)}") shows ${urls.length} URL field(s), needs both sides`)
    if (!urls.some((field) => TARGET_KEYS.has(field.key))) out.push('no comparison target URL (Current page URL, Final URL, Canonical URL, HTTP canonical, og:url)')
    if (!comparison) out.push(`verdict "${verdictRow!.key}: ${text(verdictRow!)}" is not a Comparison row`)
    else if (!/^(Equals|Differs from|Relative|Conflicting|Only|Not comparable)\b/.test(text(comparison)) || text(comparison).length > 60) out.push(`Comparison value "${text(comparison)}" is outside the closed grammar`)
    return out
  },
}

const redundant: Check = {
  id: 'F3', title: 'No redundant overview rows',
  run: (view) => {
    const out: string[] = []
    const hasComparison = view.values.some((field) => field.key === 'Comparison')
    const seen = new Map<string, DisplayField>()
    for (const field of view.values) {
      // Two different counts or two different absences are separate facts, not a repeat.
      const comparable = !/^\d+$/.test(text(field)) && !ABSENCE.has(text(field))
      const prior = comparable ? seen.get(text(field)) : undefined
      if (prior && !(hasComparison && prior.kind === 'url' && field.kind === 'url')) out.push(`"${field.key}" repeats "${prior.key}" (${text(field).slice(0, 60)})`)
      if (comparable) seen.set(text(field), field)
      if (field.kind === 'text' && /^(Yes|No)$/.test(text(field))) out.push(`Yes/No row "${field.key}: ${text(field)}"`)
      if (field.kind === 'text' && field.value === 1 && view.markup.length === 1) out.push(`count of 1 beside the single markup ("${field.key}")`)
      if (text(field) === view.input || text(field) === 'captured') out.push(`"${field.key}" restates the checked input`)
    }
    return out
  },
}

const overviewMarkup: Check = {
  id: 'F4', title: 'Element checks show the original markup in the overview, keyed by its tag',
  run: (view) => {
    const out: string[] = []
    const shown = new Set(view.values.filter(isOriginal).map(text))
    if (view.markup.length >= 1 && view.markup.length <= 3) {
      for (const field of view.markup) if (field.value.length <= 500 && !shown.has(field.value)) out.push(`markup "${field.key}" is only in details`)
    }
    for (const field of [...view.values.filter(isOriginal), ...view.markup]) {
      if (!/^<[a-z][a-z0-9-]*( [^<>]+)?>( \d+)?$/.test(field.key)) out.push(`original key "${field.key}" is not a tag label`)
    }
    return out
  },
}

export const CHECKS: Check[] = [order, bothSides, redundant, overviewMarkup, ...RECORD_CHECKS, ...VOCABULARY_CHECKS]
