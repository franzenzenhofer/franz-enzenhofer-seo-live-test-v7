import { createPresentation, textField } from './create'
import { adjustCounts } from './counts'
import type { Presentation } from './schema'

// Per-result transport budget. Phase messages are chunked (20 KB target, 64 chunks), and results are kept
// in chrome.storage.local with unlimitedStorage, so a single result may carry up to 32 KB of evidence.
export const PRESENTATION_BYTES = 32_768
const bytes = (value: unknown) => new TextEncoder().encode(JSON.stringify(value)).length

// Never run generic string truncation over attested original data: keep whole records from
// the front and state exactly how many were omitted, so a found element never becomes "nothing".
const withRecords = (view: Presentation, markupCount: number, evidenceCount: number): Presentation => ({
  ...view,
  markup: view.markup.slice(0, markupCount),
  evidence: view.evidence.slice(0, evidenceCount),
  detailValues: adjustCounts(view.detailValues, { markup: markupCount, evidence: evidenceCount },
    { markup: view.markup.length - markupCount, evidence: view.evidence.length - evidenceCount }),
  noMarkup: markupCount ? view.noMarkup : `Original markup omitted: ${view.markup.length} record(s); storage capacity exceeded`,
})

// Largest record count n (0..max) for which fits(n) holds; fits is monotone (fewer records, fewer bytes).
const largest = (max: number, fits: (count: number) => boolean) => {
  let low = 0, high = max
  while (low < high) {
    const mid = Math.ceil((low + high) / 2)
    if (fits(mid)) low = mid
    else high = mid - 1
  }
  return low
}

const keepRecords = (view: Presentation, limit: number): Presentation | null => {
  const share = (count: number, total: number) => Math.min(total, count)
  // Shrink markup and evidence together so neither list is emptied while the other keeps everything.
  const total = Math.max(view.markup.length, view.evidence.length)
  const fits = (count: number) => bytes(withRecords(view, share(count, view.markup.length), share(count, view.evidence.length))) <= limit
  if (!fits(0)) return null
  const count = largest(total, fits)
  return withRecords(view, share(count, view.markup.length), share(count, view.evidence.length))
}

export const boundPresentation = (view: Presentation, limit = PRESENTATION_BYTES): Presentation => {
  if (bytes(view) <= limit) return view
  const kept = keepRecords(view, limit)
  if (kept) return kept
  const compact = withRecords(view, 0, 0)
  compact.values = compact.values.filter((field) => field.kind !== 'original')
  if (!compact.values.length) compact.values = [textField('Evidence', 'Capture exceeds storage capacity')]
  compact.detailValues = compact.detailValues.filter((field) => field.kind !== 'original')
  if (bytes(compact) <= limit) return compact
  return createPresentation({
    name: view.name, input: view.input, pageUrl: view.pageUrl, references: view.references,
    values: [textField('Evidence', 'Result evidence exceeds storage capacity')],
    checked: [textField('Capture size', `${bytes(view)} bytes`)],
    noMarkup: 'Original markup omitted because the result exceeds storage capacity',
  })
}
