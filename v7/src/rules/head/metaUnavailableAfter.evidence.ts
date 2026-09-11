import {domPathField, originalField, textField} from '@/shared/presentation/create'
import { parseDirectiveDate } from '@/shared/robotsDate'
import { isRobotsMetaDirective } from '@/shared/robotsVocabulary'
import type { DomElementFact, DomPhaseFacts } from '@/shared/domFacts.types'
import type { DisplayField } from '@/shared/presentation/schema'

// The directive may be combined with other rules ("noindex, unavailable_after: ...");
// the date value itself may contain commas (RFC 822/850), so capture to the end.
const DIRECTIVE = /(?:^|[,;])\s*unavailable_after\s*:\s*(.+)$/i

export type DirectiveHit = { phase: 'Static' | 'Idle', value: string, date: string, timestamp: number | null, original?: DomElementFact['original'] }

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
    return [{ phase, value, ...parseDirectiveDate(value), original: element.original }]
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

export const directiveEvidence = (hits: DirectiveHit[]) => {
  const markup: Array<Extract<DisplayField, { kind: 'original' }>> = []
  const evidence = hits.map((hit, index) => {
    const fields: DisplayField[] = [
      textField('Phase', hit.phase),
      textField('Declared value (first 100 characters)', hit.value.slice(0, 100)),
      textField('Parsed date', hit.timestamp === null ? 'Not parseable' : hit.date),
    ]
    if (hit.original) {
      markup.push(originalField(`${hit.phase} <meta> markup ${index + 1}`, hit.original.html))
      fields.push(domPathField('DOM path', hit.original.selector, 'Not captured'))
    } else fields.push(textField('Markup', 'Not retained'))
    return { name: `Directive ${index + 1}`, fields }
  })
  return { evidence, markup }
}
