import { attributeOf, messageContainsValue, normalizeText, textOf } from '@/shared/textMatch'

export type Candidate = { key: string; text: string; isSource: boolean }

const MIN_OVERLAP = 20

// Snippets are capped upstream; a trailing ellipsis must not defeat containment.
export const comparable = (value: string): string =>
  normalizeText(value).replace(/(\.\.\.|…)$/u, '').trim()

/** Every reading of a block: raw text, and for markup also its stripped text and attribute value. */
export const representationsOf = (value: string): string[] => {
  const norm = comparable(value)
  const reps = norm.startsWith('<') ? [norm, textOf(value), attributeOf(value)] : [norm]
  return [...new Set(reps.filter((text) => text.length > 0))]
}

/** What a block actually tells the reader: markup counts by its text, not its tags. */
const infoOf = (value: string): string => {
  const norm = comparable(value)
  return norm.startsWith('<') ? textOf(value) || attributeOf(value) || norm : norm
}

const covered = (candidate: string, kept: string[]): boolean =>
  kept.some((text) => text === candidate || (candidate.length >= MIN_OVERLAP && text.includes(candidate)))

/**
 * Fullest information wins; on a tie the readable value beats raw markup.
 * `seeds` are texts already rendered above (the verdict message): a value
 * they fully contain is never repeated.
 */
export const dedupeCandidates = (candidates: Candidate[], seeds: string[] = []): Candidate[] => {
  const rows = candidates
    .map((entry, index) => ({ entry, reps: representationsOf(entry.text), info: infoOf(entry.text), index }))
    .filter((row) => row.info.length > 0)
  const kept: string[] = []
  const seeded = (rep: string): boolean => seeds.some((seed) => messageContainsValue(seed, rep))
  const keptIndexes = new Set<number>()
  const byInformation = [...rows].sort((a, b) =>
    (b.info.length - a.info.length) || (Number(a.entry.isSource) - Number(b.entry.isSource)))
  for (const row of byInformation) {
    if (row.reps.some((rep) => covered(rep, kept) || seeded(rep))) continue
    kept.push(...row.reps)
    keptIndexes.add(row.index)
  }
  return rows.filter((row) => keptIndexes.has(row.index)).map((row) => row.entry)
}
