import { recordCounts } from '@/shared/presentation/counts'
import { domPathField, originalField, textField } from '@/shared/presentation/create'
import { parseDirectiveDate } from '@/shared/robotsDate'
import { isRobotsMetaDirective } from '@/shared/robotsVocabulary'
import type { DomElementFact, DomPhaseFacts } from '@/shared/domFacts.types'
import type { DisplayField } from '@/shared/presentation/schema'

// The directive may be combined with other rules ("noindex, unavailable_after: ...");
// the date value itself may contain commas (RFC 822/850), so capture to the end.
const DIRECTIVE = /(?:^|[,;])\s*unavailable_after\s*:\s*(.+)$/i

export type DirectiveHit = { phase: 'Static' | 'Idle', name: string, value: string, date: string, timestamp: number | null, original?: DomElementFact['original'] }

const hitsForPhase = (facts: DomPhaseFacts | undefined, phase: DirectiveHit['phase']): DirectiveHit[] =>
  (facts?.elements || []).flatMap((element) => {
    if (element.tag !== 'meta') return []
    const attr = (key: string) => element.attrs.find(([name]) => name.toLowerCase() === key)?.[1] || ''
    const name = attr('name')
    const content = attr('content')
    if (!name || !content || !isRobotsMetaDirective(name, content)) return []
    const match = DIRECTIVE.exec(content)
    if (!match?.[1]) return []
    const value = match[1].trim()
    return [{ phase, name: name.trim().toLowerCase(), value, ...parseDirectiveDate(value), original: element.original }]
  })

// Dedupes by declared value across both phases (matching the legacy Set-based
// dedup), preferring an occurrence that carries retained original markup.
export const collectDirectiveHits = (staticFacts?: DomPhaseFacts, idleFacts?: DomPhaseFacts): DirectiveHit[] => {
  const byValue = new Map<string, DirectiveHit>()
  for (const hit of [...hitsForPhase(staticFacts, 'Static'), ...hitsForPhase(idleFacts, 'Idle')]) {
    const existing = byValue.get(hit.value)
    if (!existing || (!existing.original && hit.original)) byValue.set(hit.value, hit)
  }
  return [...byValue.values()]
}

// Each hit is known by its tag label, <meta name="robots">, numbered only when the label repeats (FORMATTING.md F4, F7).
const labelsOf = (hits: DirectiveHit[]): string[] => {
  const labels = hits.map((hit) => `<meta name="${hit.name}">`)
  const totals = new Map<string, number>()
  labels.forEach((label) => totals.set(label, (totals.get(label) || 0) + 1))
  const seen = new Map<string, number>()
  return labels.map((label) => {
    if (totals.get(label) === 1) return label
    seen.set(label, (seen.get(label) || 0) + 1)
    return `${label} ${seen.get(label)}`
  })
}

export const directiveEvidence = (hits: DirectiveHit[]) => {
  const labels = labelsOf(hits)
  const markup: Array<Extract<DisplayField, { kind: 'original' }>> = []
  const evidence = hits.map((hit, index) => {
    const fields: DisplayField[] = [
      textField('unavailable_after', hit.value), textField('Parsed date', hit.timestamp === null ? 'Unparseable' : hit.date), textField('Phase', hit.phase),
    ]
    if (hit.original) {
      markup.push(originalField(labels[index]!, hit.original.html))
      fields.push(domPathField('DOM path', hit.original.selector, 'Not captured'))
    } else fields.push(textField('Markup', 'Not captured'))
    return { name: labels[index]!, fields }
  })
  return { evidence, markup, counts: recordCounts({ found: hits.length, markup: markup.length, evidence: evidence.length }) }
}
