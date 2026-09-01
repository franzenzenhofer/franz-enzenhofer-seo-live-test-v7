import { detailText } from './detailText'
import { comparable, dedupeCandidates, representationsOf } from './detailDedupe'
import type { Candidate } from './detailDedupe'

import type { Result } from '@/shared/results'

export type DetailEntry = { key: string; text: string }
export type GuidanceEntry = DetailEntry & { label: string }
export type Provenance = { reference?: string; tested?: string }
export type TieredDetails = {
  evidence: DetailEntry[]
  guidance: GuidanceEntry[]
  measurements: DetailEntry[]
  source: DetailEntry[]
  technical: DetailEntry[]
  provenance: Provenance
}

// Raw protocol/debug payloads: real, but never the point of the finding.
const TECHNICAL_KEYS = new Set([
  'highlightSelectors', 'httpHeaders', 'headers', 'userAgent', 'apiResponse',
  'navigationTiming', 'evidenceBounds',
])
// Diagnosis/remedy vocabulary: the most actionable content on the card.
const GUIDANCE_LABELS: Record<string, string> = {
  is: 'Problem', problem: 'Problem', actual: 'Actual', expected: 'Expected',
  should: 'Fix', fix: 'Fix', recommendation: 'Fix',
}
const LONG_TEXT = 100
const SOURCE_KEY = 'sourceHtml'

export const tierDetails = (details: Result['details'], snippet?: string | null): TieredDetails => {
  const provenance: Provenance = {}
  const pool: Candidate[] = typeof snippet === 'string' && snippet.trim()
    ? [{ key: '', text: snippet, isSource: false }] : []
  const guidance: GuidanceEntry[] = []
  const measurements: DetailEntry[] = []
  const technical: DetailEntry[] = []
  for (const [key, value] of Object.entries(details ?? {})) {
    if (key === 'reference' && typeof value === 'string') { provenance.reference = value; continue }
    if (key === 'tested' && typeof value === 'string') { provenance.tested = value; continue }
    const text = detailText(value)
    if (!text) continue
    const label = GUIDANCE_LABELS[key]
    if (label) { guidance.push({ key, text, label }); continue }
    if (key === SOURCE_KEY) { pool.push({ key, text, isSource: true }); continue }
    if (TECHNICAL_KEYS.has(key)) { technical.push({ key, text }); continue }
    if (text.includes('\n') || text.length > LONG_TEXT) { pool.push({ key, text, isSource: false }); continue }
    measurements.push({ key, text })
  }
  const survivors = dedupeCandidates(pool)
  let evidence = survivors.filter((entry) => !entry.isSource).map(({ key, text }) => ({ key, text }))
  let source = survivors.filter((entry) => entry.isSource).map(({ key, text }) => ({ key, text }))
  // A card whose only surviving value is its markup shows that markup as the evidence.
  if (!evidence.length && source.length) { evidence = source; source = [] }
  const keptInfos = survivors.flatMap(({ text }) => representationsOf(text))
  return {
    evidence,
    guidance,
    measurements: measurements.filter((entry) => !keptInfos.includes(comparable(entry.text))),
    source,
    technical,
    provenance,
  }
}

export const hasTierContent = (tiers: TieredDetails): boolean =>
  tiers.evidence.length > 0 || tiers.guidance.length > 0 || tiers.measurements.length > 0
  || tiers.source.length > 0 || tiers.technical.length > 0
  || Boolean(tiers.provenance.reference || tiers.provenance.tested)
