import fs from 'node:fs'

import { buildDetailPayload, extractSnippet } from '@/components/result/resultTransforms'
import { tierDetails } from '@/components/result/detailTiers'
import { detailText } from '@/components/result/detailText'
import { normalizeText, textOf, attributeOf } from '@/shared/resultPreview'
import type { Result } from '@/shared/results'

const rows = JSON.parse(fs.readFileSync(process.argv[2] || '/tmp/rules.json', 'utf8')) as Result[]

const overlaps = (a: string, b: string): boolean => {
  const [short, long] = a.length <= b.length ? [a, b] : [b, a]
  return short.length >= 20 && long.includes(short)
}
// A pair of rendered blocks is duplicated when one's text (markup stripped
// where applicable) is contained in the other's.
const textsFor = (value: string): string[] =>
  [normalizeText(value), textOf(value), attributeOf(value)].filter((t) => t.length > 0)
const anyDup = (blocks: string[]): boolean =>
  blocks.some((a, i) => blocks.some((b, j) => i < j && textsFor(a).some((ta) => textsFor(b).some((tb) => ta === tb || overlaps(ta, tb)))))

let beforeDupCards = 0, afterDupCards = 0, beforeBlocks = 0, afterFullBlocks = 0
const tierTotals = { evidence: 0, measurements: 0, source: 0, technical: 0, provenance: 0 }
let cards = 0
for (const row of rows) {
  if (!row.details) continue
  cards += 1
  const snippet = extractSnippet(row.details)
  const payload = buildDetailPayload(row.details) ?? {}
  // BEFORE: snippet box + one full-weight labelled <pre> per detail key.
  const oldBlocks = [
    ...(snippet ? [snippet] : []),
    ...Object.values(payload).map((value) => detailText(value)).filter(Boolean),
  ]
  beforeBlocks += oldBlocks.length
  if (anyDup(oldBlocks)) beforeDupCards += 1
  // AFTER: tiered. Full-weight blocks are evidence + kept source only.
  const tiers = tierDetails(payload, snippet)
  const newBlocks = [...tiers.evidence, ...tiers.source].map((entry) => entry.text)
  afterFullBlocks += newBlocks.length
  if (anyDup(newBlocks)) afterDupCards += 1
  tierTotals.evidence += tiers.evidence.length
  tierTotals.measurements += tiers.measurements.length
  tierTotals.source += tiers.source.length
  tierTotals.technical += tiers.technical.length
  tierTotals.provenance += Number(Boolean(tiers.provenance.reference)) + Number(Boolean(tiers.provenance.tested))
}
console.log(`cards with details:            ${cards}`)
console.log(`BEFORE: full-weight blocks     ${beforeBlocks} (avg ${(beforeBlocks / cards).toFixed(1)}/card)`)
console.log(`BEFORE: cards showing the same text twice or more: ${beforeDupCards}`)
console.log(`AFTER:  full-weight blocks     ${afterFullBlocks} (avg ${(afterFullBlocks / cards).toFixed(1)}/card)`)
console.log(`AFTER:  cards showing the same text twice or more: ${afterDupCards}`)
console.log('AFTER tier totals:', tierTotals)
