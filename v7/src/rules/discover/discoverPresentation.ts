import { textField } from '@/shared/presentation/create'
import type { DisplayField } from '@/shared/presentation/schema'
import { schemaTypes } from '@/shared/structured'
import type { parseLdDetails } from '@/shared/structuredParse'
import { listRow } from '@/shared/presentation/listRow'

// Overview rows shared by the Discover rules (FORMATTING.md F3, F4, F10, F12).
type Original = Extract<DisplayField, { kind: 'original' }>
type Parsed = ReturnType<typeof parseLdDetails>
const OVERVIEW_MARKUP_LIMIT = 3
const OVERVIEW_MARKUP_MAX_CHARS = 500
const EVIDENCE_TEXT_MAX_CHARS = 160
// The unicode ellipsis keeps a value free of ". ", which reads as a sentence (F10).

/** Original markup belongs in the overview only when few; a long block (e.g. JSON-LD) stays in details (F4). */
export const overviewMarkup = (markup: Original[]): Original[] =>
  markup.length <= OVERVIEW_MARKUP_LIMIT ? markup.filter((field) => field.value.length <= OVERVIEW_MARKUP_MAX_CHARS) : []

/** Every @type declared in the parsed JSON-LD, in document order, without repeats. */
const declaredLdTypes = (parsed: Parsed): string[] =>
  [...new Set(parsed.entries.flatMap(({ node }) => schemaTypes(node)))]

/** The JSON-LD types as the observed value when the rule found nothing else in the scripts (F12). */
export const ldTypesRow = (parsed: Parsed): DisplayField[] =>
  parsed.entries.length ? [textField('JSON-LD types', listRow(declaredLdTypes(parsed)))] : []

/** Names the scripts that failed to parse; no row when every script parsed (F3, F12). */
export const parseErrorRow = (parsed: Parsed): DisplayField[] => parsed.errorCount
  ? [textField('JSON-LD parse errors', listRow(parsed.errors.map(({ scriptIndex }) => `script ${scriptIndex + 1}`)))] : []

/** The parse error of one script as an evidence field, bounded to the evidence text limit (F10). */
export const parseErrorField = (parsed: Parsed, scriptIndex: number): DisplayField[] => {
  const error = parsed.errors.find((entry) => entry.scriptIndex === scriptIndex)
  return error ? [textField('Parse error', error.message.slice(0, EVIDENCE_TEXT_MAX_CHARS))] : []
}

/** The parsed JSON-LD entities that came from the script at `scriptIndex`. */
export const entriesOfScript = (parsed: Parsed, scriptIndex: number) =>
  parsed.entries.filter((entry) => entry.scriptIndex === scriptIndex).map(({ node }) => node)
