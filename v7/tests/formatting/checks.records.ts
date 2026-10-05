import type { Check } from './checks.shared'
import { COUNT_KEYS, numberOf } from './checks.shared'

const BANNED_RECORD_NAMES = /^(Capture|Capture status|Source|Source locations|Retrieved source elements|Checked headers)$/
const fromDom = (input: string) => /DOM/.test(input)

const foundShown: Check = {
  id: 'F5', title: 'N found means N shown: details never ship zero evidence and zero markup',
  run: (view, _run, doc) => {
    const out: string[] = []
    const shipped = view.markup.length + view.evidence.length + view.values.filter((field) => field.kind === 'original').length
    const total = (numberOf(view.detailValues, 'Markup retained') ?? 0) + (numberOf(view.detailValues, 'Markup omitted') ?? 0)
    if (fromDom(view.input) && total > 0 && !shipped) out.push(`${total} element(s) counted, none shipped`)
    if (fromDom(view.input) && total > 0 && !view.markup.length && !view.noMarkup.startsWith('Not retained:')) out.push(`${total} element(s) counted, no markup shipped ("${view.noMarkup}")`)
    // The selector the rule says it queried must not find elements the card then fails to show.
    const selector = view.checked.find((field) => field.key === 'Selector')?.value
    if (typeof selector === 'string' && fromDom(view.input)) {
      let found = 0
      try { found = doc.querySelectorAll(selector).length } catch { found = 0 }
      if (found && !shipped) out.push(`selector "${selector}" matches ${found} element(s), card shows none`)
    }
    return out
  },
}

const truthfulCounts: Check = {
  id: 'F6', title: 'Retained/omitted counts use four fixed keys, live in details, equal what ships and add up',
  run: (view) => {
    const out: string[] = []
    const all = [...view.values, ...view.detailValues, ...view.checked, ...view.evidence.flatMap((record) => record.fields)]
    for (const field of all) {
      if (/ (retained|omitted)$/i.test(field.key) && !COUNT_KEYS.includes(field.key)) out.push(`non-standard count key "${field.key}"`)
      if (/\(storage limit\)/.test(field.key)) out.push(`appended storage row "${field.key}"`)
    }
    for (const field of [...view.values, ...view.checked]) if (COUNT_KEYS.includes(field.key)) out.push(`"${field.key}" outside details`)
    const markupKept = numberOf(view.detailValues, 'Markup retained')
    const evidenceKept = numberOf(view.detailValues, 'Evidence retained')
    if (markupKept !== undefined && markupKept !== view.markup.length) out.push(`Markup retained ${markupKept} but ${view.markup.length} shipped`)
    if (evidenceKept !== undefined && evidenceKept !== view.evidence.length) out.push(`Evidence retained ${evidenceKept} but ${view.evidence.length} shipped`)
    const present = COUNT_KEYS.filter((key) => numberOf(view.detailValues, key) !== undefined).length
    if (fromDom(view.input) && view.markup.length + view.evidence.length > 0 && present !== 4) out.push(`${present} of the 4 count rows present`)
    if (present === 4) {
      const markupTotal = markupKept! + numberOf(view.detailValues, 'Markup omitted')!
      const evidenceTotal = evidenceKept! + numberOf(view.detailValues, 'Evidence omitted')!
      if (markupTotal !== evidenceTotal) out.push(`markup total ${markupTotal} differs from evidence total ${evidenceTotal}`)
    }
    return out
  },
}

const recordPerElement: Check = {
  id: 'F7', title: 'One evidence record per element, named by the element, one DOM path',
  run: (view) => view.evidence.flatMap((record) => {
    const out: string[] = []
    if (BANNED_RECORD_NAMES.test(record.name)) out.push(`evidence record named "${record.name}"`)
    const paths = record.fields.filter((field) => field.kind === 'path')
    if (paths.length > 1) out.push(`record "${record.name}" bundles ${paths.length} DOM paths`)
    for (const field of paths) if (field.key !== 'DOM path') out.push(`path key "${field.key}" in "${record.name}"`)
    for (const field of record.fields) {
      if (/^DOM path \d+$/.test(field.key)) out.push(`numbered "${field.key}" in "${record.name}"`)
    }
    return out
  }),
}

export const RECORD_CHECKS: Check[] = [foundShown, truthfulCounts, recordPerElement]
