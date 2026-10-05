import { sampleElements } from './domEvidence'
import { textField } from './presentation/create'
import { listRow } from './presentation/listRow'
import { elementRecords } from './presentation/records'
import type { DisplayField, EvidenceRecord } from './presentation/schema'
import { parseLdDetails, schemaTypes } from './structured'

// JSON-LD script evidence shared by dom:ldjson and the schema:* family (FORMATTING.md F4-F7):
// one original markup field and one evidence record per <script type="application/ld+json">.
export const LD_SELECTOR = 'script[type="application/ld+json"]'
const LD_LABEL = '<script type="application/ld+json">'
const OVERVIEW_MARKUP_LIMIT = 3
const OVERVIEW_MARKUP_CHARS = 500
const EVIDENCE_VALUE_LIMIT = 160

type ParsedLd = ReturnType<typeof parseLdDetails>
const unique = (values: string[]) => [...new Set(values)]
const errorFields = (error: { message: string } | undefined): DisplayField[] =>
  error ? [textField('Syntax', 'Invalid JSON'), textField('Error', listRow([error.message], EVIDENCE_VALUE_LIMIT))] : []

export const declaredTypes = (parsed: ParsedLd): string[] => unique(parsed.entries.flatMap(({ node }) => schemaTypes(node)))

/** The overview row naming the scripts that failed to parse, e.g. "script 2" or "scripts 1, 3 … 4 more". */
export const parseErrorRow = (parsed: ParsedLd): DisplayField[] => {
  if (!parsed.errorCount) return []
  const numbers = parsed.errors.map(({ scriptIndex }) => String(scriptIndex + 1))
  const hidden = parsed.errorCount - parsed.errors.length
  return [textField('Parse errors', `${parsed.errorCount === 1 ? 'script' : 'scripts'} ${listRow(numbers, 52, hidden)}`)]
}

type Extra = (scriptIndex: number) => DisplayField[]

/** `extra(scriptIndex)` adds rule-specific facts about the entities inside that script. */
export const ldScriptRecords = (doc: Document, parsed: ParsedLd, extra: Extra = () => []) => {
  const scripts = sampleElements(doc.querySelectorAll(LD_SELECTOR))
  const typesOf = (index: number) => unique(parsed.entries.filter((entry) => entry.scriptIndex === index).flatMap(({ node }) => schemaTypes(node)))
  const records = elementRecords(scripts.sample, scripts.total, (_element, index) => [
    textField('Types', listRow(typesOf(index), EVIDENCE_VALUE_LIMIT)),
    ...errorFields(parsed.errors.find(({ scriptIndex }) => scriptIndex === index)),
    ...extra(index),
  ])
  // Parse errors in scripts beyond the inspected sample still get their own record, numbered like the sample.
  const outsideSample: EvidenceRecord[] = parsed.errors.filter(({ scriptIndex }) => scriptIndex >= scripts.shown)
    .map((error) => ({ name: `${LD_LABEL} ${error.scriptIndex + 1}`, fields: errorFields(error) }))
  const short = records.markup.length <= OVERVIEW_MARKUP_LIMIT && records.markup.every((field) => field.value.length <= OVERVIEW_MARKUP_CHARS)
  // The four count rows state what was found; with no script at all they would only add zeros.
  return { total: scripts.total, markup: records.markup, counts: scripts.total ? records.counts : [],
    evidence: [...records.evidence, ...outsideSample], overviewMarkup: short ? records.markup : [] }
}
